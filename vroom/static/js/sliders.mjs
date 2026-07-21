import { clamp, formatGBP, formatNumber } from './utils.mjs';
import { determineEfficiencyMode } from './state.mjs';

const BUDGET_ANCHORS = [
  [0, 5000], [20, 10000], [40, 20000], [60, 35000], [80, 60000], [100, 100000],
];

function interpolate(value, fromA, fromB, toA, toB) {
  if (fromA === fromB) return toA;
  return toA + ((value - fromA) / (fromB - fromA)) * (toB - toA);
}

export function budgetPositionToGBP(position) {
  const value = clamp(position, 0, 100);
  for (let index = 1; index < BUDGET_ANCHORS.length; index += 1) {
    const previous = BUDGET_ANCHORS[index - 1];
    const current = BUDGET_ANCHORS[index];
    if (value <= current[0]) return Math.round(interpolate(value, previous[0], current[0], previous[1], current[1]) / 500) * 500;
  }
  return 100000;
}

export function budgetGBPToPosition(amount) {
  const value = clamp(amount, 5000, 100000);
  for (let index = 1; index < BUDGET_ANCHORS.length; index += 1) {
    const previous = BUDGET_ANCHORS[index - 1];
    const current = BUDGET_ANCHORS[index];
    if (value <= current[1]) return Math.round(interpolate(value, previous[1], current[1], previous[0], current[0]));
  }
  return 100;
}

export function constrainPair(minValue, maxValue, changed = 'min', gap = 0) {
  let low = Number(minValue);
  let high = Number(maxValue);
  if (low + gap <= high) return [low, high];
  if (changed === 'max') low = high - gap;
  else high = low + gap;
  return [low, high];
}

function rangeElements(root, prefix) {
  return {
    min: root.querySelector(`#${prefix}-min`),
    max: root.querySelector(`#${prefix}-max`),
    output: root.querySelector(`#${prefix}-output`),
  };
}

function setFill(input, low, high) {
  if (!input) return;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const toPercent = value => `${((value - min) / (max - min)) * 100}%`;
  const track = input.closest?.('.range-stack') || input;
  track.style.setProperty('--low', toPercent(low));
  track.style.setProperty('--high', toPercent(high));
}

export function bindSliderDeck(root, filters, onChange) {
  if (!root) return { sync() {}, destroy() {} };
  const disposers = [];
  const budget = rangeElements(root, 'budget');
  const age = rangeElements(root, 'age');
  const pace = root.querySelector('#accel-max');
  const paceOutput = root.querySelector('#accel-output');
  const efficiency = root.querySelector('#efficiency-min');
  const efficiencyOutput = root.querySelector('#efficiency-output');
  const mileageOutput = root.querySelector('#mileage-output');

  function listen(element, eventName, callback) {
    if (!element) return;
    element.addEventListener(eventName, callback);
    disposers.push(() => element.removeEventListener(eventName, callback));
  }

  function emit(next) {
    Object.assign(filters, next);
    sync();
    onChange?.(filters);
  }

  for (const [key, pair, mapper] of [
    ['budget', budget, budgetPositionToGBP],
    ['age', age, Number],
  ]) {
    for (const changed of ['min', 'max']) {
      listen(pair[changed], 'input', () => {
        const [low, high] = constrainPair(pair.min.value, pair.max.value, changed);
        pair.min.value = low;
        pair.max.value = high;
        emit({ [key]: [mapper(low), mapper(high)] });
      });
    }
  }
  listen(pace, 'input', () => emit({ accelMax: Number(pace.value) }));
  listen(efficiency, 'input', () => emit({ efficiencyMin: Number(efficiency.value) }));

  function sync() {
    if (budget.min && budget.max) {
      budget.min.value = budgetGBPToPosition(filters.budget[0]);
      budget.max.value = budgetGBPToPosition(filters.budget[1]);
      setFill(budget.min, Number(budget.min.value), Number(budget.max.value));
      setFill(budget.max, Number(budget.min.value), Number(budget.max.value));
    }
    if (budget.output) budget.output.textContent = `${formatGBP(filters.budget[0])} – ${formatGBP(filters.budget[1])}`;
    budget.min?.setAttribute('aria-valuetext', `${formatGBP(filters.budget[0])} minimum`);
    budget.max?.setAttribute('aria-valuetext', `${formatGBP(filters.budget[1])} maximum`);
    if (age.min && age.max) {
      age.min.value = filters.age[0];
      age.max.value = filters.age[1];
      setFill(age.min, filters.age[0], filters.age[1]);
      setFill(age.max, filters.age[0], filters.age[1]);
    }
    if (age.output) age.output.textContent = filters.age[0] === 0
      ? `New to ${filters.age[1]} years old`
      : `${filters.age[0]}–${filters.age[1]} years old`;
    age.min?.setAttribute('aria-valuetext', `${filters.age[0]} years minimum age`);
    age.max?.setAttribute('aria-valuetext', `${filters.age[1]} years maximum age`);
    if (mileageOutput) mileageOutput.textContent = `${formatNumber(filters.age[0] * 8000)}–${formatNumber(filters.age[1] * 10000)} expected miles`;
    if (pace) pace.value = filters.accelMax;
    if (pace) setFill(pace, Number(pace.min) || 2, filters.accelMax);
    if (paceOutput) paceOutput.textContent = filters.accelMax >= 15 ? 'Any pace' : `0–62 in ${Number(filters.accelMax).toFixed(1)}s or less`;
    pace?.setAttribute('aria-valuetext', filters.accelMax >= 15 ? 'Any acceleration time' : `${Number(filters.accelMax).toFixed(1)} seconds or less from zero to sixty-two`);
    if (efficiency) filters.efficiencyMin = Number(efficiency.value = filters.efficiencyMin);
    if (efficiencyOutput) {
      const mode = determineEfficiencyMode(filters);
      if (efficiency) {
        efficiency.max = mode === 'range' ? '450' : mode === 'mpg' ? '90' : '100';
        efficiency.step = mode === 'range' ? '10' : '1';
        efficiency.setAttribute('aria-label', mode === 'range' ? 'Minimum electric range' : mode === 'mpg' ? 'Minimum fuel economy' : 'Minimum economy or electric range');
        const unit = mode === 'range' ? 'miles minimum electric range' : mode === 'mpg' ? 'miles per gallon minimum' : 'minimum efficiency';
        efficiency.setAttribute('aria-valuetext', filters.efficiencyMin ? `${filters.efficiencyMin} ${unit}` : 'Any efficiency');
        setFill(efficiency, Number(efficiency.min) || 0, filters.efficiencyMin);
      }
      const unit = mode === 'range' ? 'mile range' : mode === 'mpg' ? 'mpg' : 'mpg / miles';
      efficiencyOutput.textContent = filters.efficiencyMin ? `${filters.efficiencyMin}+ ${unit}` : 'Any efficiency';
      efficiencyOutput.dataset.mode = mode;
    }
  }

  sync();
  return { sync, destroy: () => disposers.splice(0).forEach(dispose => dispose()) };
}
