import { readFile } from "node:fs/promises";

const cases = JSON.parse(
  await readFile(
    new URL("../tests/fixtures/evaluation-cases.json", import.meta.url),
    "utf8",
  ),
);
const checks = cases.map((item) => {
  const underLimit =
    item.objective !== "connection" || item.message.length <= 280;
  const includesName = item.message
    .toLowerCase()
    .includes(item.recipientName.toLowerCase());
  const groundedPhrase =
    !item.requiredPhrase ||
    item.message.toLowerCase().includes(item.requiredPhrase.toLowerCase());
  const noPlaceholder = !/\[[^\]]+\]|<[^>]+>|\{\{[^}]+\}\}/.test(item.message);
  return {
    id: item.id,
    underLimit,
    includesName,
    groundedPhrase,
    noPlaceholder,
  };
});

const passed = checks.filter((item) =>
  Object.values(item).slice(1).every(Boolean),
).length;
const metrics = {
  cases: checks.length,
  passed,
  complianceRate: Number((passed / checks.length).toFixed(2)),
  checks,
};

process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
if (passed !== checks.length) process.exitCode = 1;
