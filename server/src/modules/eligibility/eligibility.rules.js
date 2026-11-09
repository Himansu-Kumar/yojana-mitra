import { ELIGIBILITY_FIELDS, RULE_OPS } from "./eligibility.fields.js";

/**
 * Validates an array of eligibility rules.
 * @param {any} rules
 * @returns {{ ok: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateRules(rules) {
  const errors = [];

  if (!Array.isArray(rules)) {
    return { ok: false, errors: [{ path: "", message: "Rules must be an array" }] };
  }

  function check(rule, path) {
    if (!rule || typeof rule !== "object") {
      errors.push({ path, message: "Rule must be an object" });
      return;
    }

    if (rule.anyOf) {
      if (!rule.label || typeof rule.label !== "string" || !rule.label.trim()) {
        errors.push({ path: path ? `${path}.label` : "label", message: "anyOf needs a label" });
      }
      if (!Array.isArray(rule.anyOf) || rule.anyOf.length === 0) {
        errors.push({ path: path ? `${path}.anyOf` : "anyOf", message: "anyOf must be a non-empty array" });
      } else {
        rule.anyOf.forEach((r, i) => check(r, path ? `${path}.anyOf[${i}]` : `anyOf[${i}]`));
      }
      return;
    }

    if (!rule.label || typeof rule.label !== "string" || !rule.label.trim()) {
      errors.push({ path: path ? `${path}.label` : "label", message: "Missing label" });
    }

    const def = ELIGIBILITY_FIELDS[rule.field];
    if (!def) {
      errors.push({ path: path ? `${path}.field` : "field", message: `Unknown field "${rule.field}"` });
      return;
    }

    if (!RULE_OPS.includes(rule.op)) {
      errors.push({ path: path ? `${path}.op` : "op", message: `Unknown op "${rule.op}"` });
      return;
    }

    if (rule.op === "between") {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) {
        errors.push({ path: path ? `${path}.value` : "value", message: "between needs [min, max]" });
      } else {
        const [min, max] = rule.value;
        if (typeof min !== "number" || typeof max !== "number" || Number.isNaN(min) || Number.isNaN(max)) {
          errors.push({ path: path ? `${path}.value` : "value", message: "between values must be numbers" });
        } else if (min > max) {
          errors.push({ path: path ? `${path}.value` : "value", message: "between requires min <= max" });
        }
      }
    } else if (rule.op === "in") {
      if (!Array.isArray(rule.value)) {
        errors.push({ path: path ? `${path}.value` : "value", message: "in needs an array" });
      } else if (def.options) {
        for (const v of rule.value) {
          if (!def.options.includes(v)) {
            errors.push({ path: path ? `${path}.value` : "value", message: `"${v}" not an option of ${rule.field}` });
          }
        }
      }
    } else if (rule.op === "eq") {
      if (def.type === "boolean" && typeof rule.value !== "boolean") {
        errors.push({ path: path ? `${path}.value` : "value", message: `"${rule.field}" is boolean, eq value must be boolean` });
      } else if (def.options && !def.options.includes(rule.value)) {
        errors.push({ path: path ? `${path}.value` : "value", message: `"${rule.value}" not an option of ${rule.field}` });
      }
    } else if (rule.op === "lte" || rule.op === "gte") {
      if (typeof rule.value !== "number" || Number.isNaN(rule.value)) {
        errors.push({ path: path ? `${path}.value` : "value", message: `${rule.op} value must be a number` });
      }
    }
  }

  rules.forEach((r, i) => check(r, `[${i}]`));

  return { ok: errors.length === 0, errors };
}

