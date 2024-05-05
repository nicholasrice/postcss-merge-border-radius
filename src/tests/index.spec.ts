import postcss from "postcss";
import plugin from "../index.js";
import { test } from "uvu";
import Assert from "uvu/assert";
import prettier from "prettier";

/**
 * Simple tagged-template literal for syntax highlighting,
 * and normalizes CSS strings with prettier
 */
export function css(
  value: TemplateStringsArray,
  interpolations?: never,
): Promise<string> {
  return prettier.format(value.join(""), { filepath: "test.css" });
}

test("should merge when all corner values are identical", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
      border-bottom-left-radius: 10px;
    }
  `;

  const result = await css`
    .class {
      border-radius: 10px;
    }
  `;
  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test("should merge when all corner values are identical variables", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: var(--test);
      border-top-right-radius: var(--test);
      border-bottom-right-radius: var(--test);
      border-bottom-left-radius: var(--test);
    }
  `;

  const result = await css`
    .class {
      border-radius: var(-test);
    }
  `;
  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test("should merge when all corner values are identical and divided", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: 10px 20px;
      border-top-right-radius: 10px 20px;
      border-bottom-right-radius: 10px 20px;
      border-bottom-left-radius: 10px 20px;
    }
  `;

  const result = await css`
    .class {
      border-radius: 10px / 20px;
    }
  `;

  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test("should not merge when all corner values are identical but !important is not", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px !important;
      border-bottom-right-radius: 10px;
      border-bottom-left-radius: 10px;
    }
  `;

  const result = await css`
    .class {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px !important;
      border-bottom-right-radius: 10px;
      border-bottom-left-radius: 10px;
    }
  `;

  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test("should merge when top-left === bottom-right and top-right === bottom-left", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: 10px;
      border-top-right-radius: 20px;
      border-bottom-right-radius: 10px;
      border-bottom-left-radius: 20px;
    }
  `;

  const result = await css`
    .class {
      border-radius: 10px 20px;
    }
  `;

  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test("should merge when top-right === bottom-left", async () => {
  const fixture = await css`
    .class {
      border-top-left-radius: 10px;
      border-top-right-radius: 20px;
      border-bottom-right-radius: 30px;
      border-bottom-left-radius: 20px;
    }
  `;

  const result = await css`
    .class {
      border-radius: 10px 20px 30px;
    }
  `;

  const processed = postcss([plugin]).process(fixture);
  Assert.is(processed.css, result);
});

test.run();
