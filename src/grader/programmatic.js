// src/grader/programmatic.js

/**
 * Fast, deterministic graders that run without LLM calls.
 * Returns a score 0.0–1.0.
 */

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalize(text) {
  return text?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
}

function wordCount(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0;
}

function containsAll(text, keywords) {
  const n = normalize(text);
  return keywords.filter(k => n.includes(k.toLowerCase()));
}

function hasCodeBlock(text) {
  return /```[\s\S]*?```/.test(text) || /function\s+\w+\s*\(/.test(text) || /class\s+\w+/.test(text);
}

function hasNumberedSteps(text) {
  return /^\s*(\d+[\.\)]|\-|\*)/m.test(text);
}

function extractNumbers(text) {
  return (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

// ─── Category Graders ─────────────────────────────────────────────────────────

export function gradeCoding(response, task) {
  let score = 0;
  const details = [];

  // Has code
  if (hasCodeBlock(response)) { score += 0.25; details.push('has code block +0.25'); }

  // Has a function/class declaration
  if (/function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(/.test(response)) {
    score += 0.15; details.push('function/class declaration +0.15');
  }

  // Has return statement
  if (/return\s+/.test(response)) { score += 0.1; details.push('return statement +0.1'); }

  // Handles edge cases (mentioned in response)
  if (/edge case|null|undefined|empty|zero|negative/i.test(response)) {
    score += 0.1; details.push('edge cases mentioned +0.1');
  }

  // Has explanation
  if (wordCount(response) > 50) { score += 0.1; details.push('explanation present +0.1'); }

  // Task-specific keyword checks
  const criteria = task.evaluationCriteria || [];
  const keywords = criteria.flatMap(c => c.split(/\s+/).filter(w => w.length > 4));
  const found = containsAll(response, keywords.slice(0, 8));
  const keywordScore = (found.length / Math.max(keywords.slice(0, 8).length, 1)) * 0.3;
  score += keywordScore;
  details.push(`keywords: ${found.length}/${keywords.slice(0, 8).length} +${keywordScore.toFixed(2)}`);

  return { score: Math.min(score, 1.0), details };
}

export function gradeMath(response, task) {
  let score = 0;
  const details = [];

  // Has formulas/equations
  if (/[=\+\-\*\/\^]\s*[\d\w]/.test(response)) { score += 0.15; details.push('formulas present +0.15'); }

  // Shows work (multiple lines with numbers)
  const numbers = extractNumbers(response);
  if (numbers.length >= 4) { score += 0.15; details.push(`${numbers.length} numbers found +0.15`); }

  // Has clear sections (a, b, c)
  if (/\(a\)|\(b\)|\(c\)/i.test(response)) { score += 0.15; details.push('multi-part answers +0.15'); }

  // Uses math language
  const mathTerms = ['therefore', 'thus', 'hence', 'substitute', 'solve', 'equation', 'formula', 'calculate', 'logarithm', 'probability', 'derivative'];
  const foundTerms = containsAll(response, mathTerms);
  score += Math.min(foundTerms.length * 0.05, 0.2);
  details.push(`math terms: ${foundTerms.length} +${Math.min(foundTerms.length * 0.05, 0.2).toFixed(2)}`);

  // Length check — math needs working shown
  if (wordCount(response) > 150) { score += 0.15; details.push('sufficient length +0.15'); }
  if (wordCount(response) > 300) { score += 0.1; details.push('detailed working +0.1'); }

  // Final answer clearly stated
  if (/final answer|therefore|result is|=\s*[\d\$]/.test(response)) {
    score += 0.1; details.push('final answer stated +0.1');
  }

  return { score: Math.min(score, 1.0), details };
}

export function gradeReasoning(response, task) {
  let score = 0;
  const details = [];

  // Structured steps
  if (hasNumberedSteps(response)) { score += 0.2; details.push('numbered steps +0.2'); }

  // Has clear conclusion
  if (/conclusion|therefore|in summary|the answer is|recommend|result/i.test(response)) {
    score += 0.15; details.push('conclusion present +0.15');
  }

  // Considers multiple possibilities
  if (/however|alternatively|on the other hand|but|although|unless/i.test(response)) {
    score += 0.1; details.push('considers alternatives +0.1');
  }

  // Length (reasoning needs depth)
  const wc = wordCount(response);
  if (wc > 100) { score += 0.1; details.push('adequate length +0.1'); }
  if (wc > 250) { score += 0.1; details.push('detailed reasoning +0.1'); }

  // Uses logical connectives
  const logicTerms = ['because', 'since', 'therefore', 'implies', 'if', 'then', 'given', 'assume', 'follows'];
  const found = containsAll(response, logicTerms);
  score += Math.min(found.length * 0.05, 0.25);
  details.push(`logic terms: ${found.length} +${Math.min(found.length * 0.05, 0.25).toFixed(2)}`);

  // Addresses the specific question (crude keyword match)
  const titleWords = (task.title || '').split(' ').filter(w => w.length > 4).map(w => w.toLowerCase());
  const titleFound = containsAll(response, titleWords);
  if (titleFound.length > 0) { score += 0.1; details.push('on-topic +0.1'); }

  return { score: Math.min(score, 1.0), details };
}

export function gradeWriting(response, task) {
  let score = 0;
  const details = [];

  const wc = wordCount(response);

  // Word count compliance (tasks specify ranges)
  const prompt = task.prompt || '';
  const minMatch = prompt.match(/(\d+)[\s-]+(?:to[\s-]+)?(\d+)[\s-]+words?/i);
  if (minMatch) {
    const min = parseInt(minMatch[1]);
    const max = parseInt(minMatch[2]);
    if (wc >= min && wc <= max) { score += 0.3; details.push(`word count in range ${min}-${max} +0.3`); }
    else if (wc >= min * 0.8 && wc <= max * 1.2) { score += 0.15; details.push('word count near range +0.15'); }
    else details.push(`word count ${wc} outside range ${min}-${max}`);
  } else {
    if (wc > 80) { score += 0.15; details.push('adequate length +0.15'); }
    if (wc > 200) { score += 0.1; details.push('substantial content +0.1'); }
  }

  // Structure
  if (/^(subject:|dear|to:|from:)/im.test(response)) { score += 0.1; details.push('email format +0.1'); }
  if (/\n\n/.test(response)) { score += 0.1; details.push('paragraph breaks +0.1'); }

  // Persuasive language (for persuasive tasks)
  if (/benefit|value|opportunity|recommend|suggest|propose/i.test(response)) {
    score += 0.1; details.push('persuasive language +0.1');
  }

  // Clear call to action or conclusion
  if (/please|could you|I would appreciate|looking forward|sincerely|regards|next step/i.test(response)) {
    score += 0.1; details.push('CTA/closing +0.1');
  }

  // Professional tone indicators
  if (wc > 30 && !/lol|omg|gonna|wanna|tbh/i.test(response)) {
    score += 0.1; details.push('professional tone +0.1');
  }

  // Avoids generic phrases
  const clichés = ['game changer', 'synergy', 'leverage', 'at the end of the day', 'move the needle'];
  const clichéCount = containsAll(response, clichés).length;
  if (clichéCount === 0) { score += 0.1; details.push('avoids clichés +0.1'); }
  else details.push(`clichés found: ${clichéCount} (penalty)`);

  return { score: Math.min(score, 1.0), details };
}

export function gradeAnalysis(response, task) {
  let score = 0;
  const details = [];

  // Has structured sections
  if (/\d+\.|^\s*[-•]/m.test(response)) { score += 0.15; details.push('structured sections +0.15'); }

  // Has specific recommendations
  if (/recommend|suggest|should|propose|prioritize|action/i.test(response)) {
    score += 0.15; details.push('recommendations present +0.15');
  }

  // Acknowledges trade-offs
  if (/trade.?off|however|on the other hand|downside|risk|limitation|caveat/i.test(response)) {
    score += 0.15; details.push('trade-offs acknowledged +0.15');
  }

  // Uses data/numbers
  const numbers = extractNumbers(response);
  if (numbers.length >= 3) { score += 0.1; details.push('uses data/numbers +0.1'); }

  // Framework usage
  const frameworks = ["porter's", 'swot', 'pestel', 'okr', 'kpi', 'five forces', 'fishbone', '5-why', 'root cause'];
  const fwFound = containsAll(response, frameworks);
  if (fwFound.length > 0) { score += 0.1; details.push(`frameworks: ${fwFound.join(', ')} +0.1`); }

  // Length
  const wc = wordCount(response);
  if (wc > 200) { score += 0.1; details.push('substantial analysis +0.1'); }
  if (wc > 400) { score += 0.1; details.push('deep analysis +0.1'); }

  // On topic
  const titleWords = (task.title || '').toLowerCase().split(' ').filter(w => w.length > 4);
  const found = containsAll(response, titleWords);
  if (found.length > 0) { score += 0.05; details.push('on-topic +0.05'); }
  if (/in conclusion|to summarize|overall|key takeaway/i.test(response)) {
    score += 0.1; details.push('summary/conclusion +0.1');
  }

  return { score: Math.min(score, 1.0), details };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const GRADERS = {
  coding:    gradeCoding,
  math:      gradeMath,
  reasoning: gradeReasoning,
  writing:   gradeWriting,
  analysis:  gradeAnalysis,
};

export function programmaticGrade(response, task) {
  const grader = GRADERS[task.category] || gradeReasoning;
  const result = grader(response, task);
  return {
    score: parseFloat(result.score.toFixed(3)),
    details: result.details,
    method: 'programmatic',
    category: task.category,
  };
}
