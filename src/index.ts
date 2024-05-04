import postcss, * as PostCSS from "postcss";

const name = "postcss-merge-border-radius";

/**
 * Options configuration
 */
export interface Options {}

const pluginFactory: PostCSS.PluginCreator<Options> = (
  options: Options = {},
) => {
  return {
    postcssPlugin: name,
    Rule: processRule,
  };
};
pluginFactory.postcss = true;

export default pluginFactory;

const illogicalTester = /border-(top|bottom)-(left|right)-radius/;
const logicalTester = /border-(start|end)-(start|end)-radius/;

function processRule(rule: PostCSS.Rule): void {
  reduce(rule, illogicalTester);
  reduce(rule, logicalTester);
}

function reduce(rule: PostCSS.Rule, matcher: RegExp): void {
  const matches = filterDeclarations(rule, matcher);
  reduceIfAllSame(matches);
}

/**
 *
 * @param declarations
 */
function reduceIfAllSame(declarations: PostCSS.Declaration[]): void {
  const noDuplicateProperties =
    new Set(declarations.map((value) => value.prop)).size === 4;

  if (noDuplicateProperties) {
    if (declarationValuesAndImportantAreEqual(declarations)) {
      const radiusRule = declarations[0].clone();
      radiusRule.prop = "border-radius";
      radiusRule.value = postcss.list.space(radiusRule.value).join(" / ");
      declarations[0].before(radiusRule);
      declarations.forEach((value) => value.remove());
    }
  }
}

function filterDeclarations(
  rule: postcss.Rule,
  matcher: string | RegExp,
): postcss.Declaration[] {
  const result = [];
  rule.walkDecls(matcher, (declaration) => {
    result.push(declaration);
  });
  return result;
}

/**
 * Tests if declaration values and important flags are equal
 */
function declarationValuesAndImportantAreEqual(
  declarations: postcss.Declaration[],
) {
  // Require 2 declarations
  if (declarations.length < 1) {
    return false;
  }

  const reference = declarations[0];

  return declarations.every((value) => {
    return (
      value.value === reference.value && value.important === reference.important
    );
  });
}
