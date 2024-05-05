import { type Rule, type Declaration, type PluginCreator } from "postcss";

const name = "PostCSS-merge-border-radius";

/**
 * Options configuration
 */
export interface Options {}

const pluginFactory: PluginCreator<Options> = (options: Options = {}) => {
  return {
    postcssPlugin: name,
    Rule: processRule,
  };
};

pluginFactory.postcss = true;

export default pluginFactory;

const tester = /border-(top|bottom)-(left|right)-radius/;

function processRule(rule: Rule, { list, Declaration }): void {
  const matches = filterDeclarations(rule, tester);
  const noDuplicateProperties =
    new Set(matches.map((value) => value.prop)).size === 4;
  if (noDuplicateProperties) {
    const merge = MergeDeclarations.create(
      matches as [Declaration, Declaration, Declaration, Declaration],
      rule,
    );

    merge.merge(list, Declaration);
  }
}

function filterDeclarations(
  rule: Rule,
  matcher: string | RegExp,
): Declaration[] {
  const result = [];
  rule.walkDecls(matcher, (declaration) => {
    result.push(declaration);
  });
  return result;
}

/**
 * Create type for postcss 'list' import
 */
interface List {
  space(str: string): string[];
}

/**
 * Represents the 4 corners of a set of declarations that can be merged
 *
 * a------b
 * |      |
 * d------c
 */
interface IMergeDeclarations {
  /**
   * Merge the declarations
   */
  merge(list: List, declaration: typeof Declaration): void;
}

class MergeDeclarations implements IMergeDeclarations {
  private static aTest = /^border-(start-start|top-left)-radius$/;
  private static bTest = /^border-(start-end|top-right)-radius$/;
  private static cTest = /^border-(end-end|bottom-right)-radius$/;
  private static dTest = /(^border-end-start|bottom-left)-radius$/;

  /**
   * All values as an array
   */
  private values: Readonly<
    [a: Declaration, b: Declaration, c: Declaration, d: Declaration]
  >;
  private constructor(
    private readonly a: Declaration,
    private readonly b: Declaration,
    private readonly c: Declaration,
    private readonly d: Declaration,
    private readonly rule: Rule,
  ) {
    this.values = Object.freeze([a, b, c, d]);
  }

  /**
   * Returns a IMergeDeclaration if the declarations can be merged,
   * otherwise null.
   */
  public static create(
    declarations: [Declaration, Declaration, Declaration, Declaration],
    rule: Rule,
  ): IMergeDeclarations | null {
    const a = declarations.find((value) => this.aTest.test(value.prop));
    const b = declarations.find((value) => this.bTest.test(value.prop));
    const c = declarations.find((value) => this.cTest.test(value.prop));
    const d = declarations.find((value) => this.dTest.test(value.prop));

    if (a !== null && b !== null && c !== null && d !== null) {
      return new MergeDeclarations(a, b, c, d, rule);
    } else {
      return null;
    }
  }

  public merge(list: List, declaration: typeof Declaration) {
    const someValuesImportant = this.someValuesImportant;
    const allValuesImportant = this.allValuesImportant;

    if (someValuesImportant && !allValuesImportant) {
      // Don't try to merge if only some of the values are !important
      return;
    }

    const aSplit = list.space(this.a.value);

    if (this.allValuesEqual) {
      const value = this.mergeValues([aSplit]);
      const important = this.a.important;
      this.mergeRules(declaration, value, important);
      return;
    }

    const aIsC = this.areEqual(this.a, this.c);
    const bIsD = this.areEqual(this.b, this.d);
    const bSplit = list.space(this.b.value);
    const cSplit = list.space(this.c.value);
    const dSplit = list.space(this.d.value);

    let value: string;
    if (aIsC && bIsD) {
      // reduce to A B / a b
      value = this.mergeValues([aSplit, bSplit]);
    } else if (bIsD) {
      // reduce to A B C / a b c
      value = this.mergeValues([aSplit, bSplit, cSplit]);
    } else {
      // reduce to A B C D / a b c d
      value = this.mergeValues([aSplit, bSplit, cSplit, dSplit]);
    }

    this.mergeRules(declaration, value, allValuesImportant);
  }

  private mergeRules(
    constructableDeclaration: typeof Declaration,
    value: string,
    important?: boolean,
  ) {
    const declaration = new constructableDeclaration({
      prop: "border-radius",
      value,
      important,
    });
    declaration.source = this.a.source;
    this.rule.insertBefore(this.a, declaration);
    this.values.forEach((value) => value.remove());
  }

  private mergeValues(values: Array<string[]>) {
    let useSecondPart = false;
    const firstPart = values.map((values) => values[0]).join(" ");
    const secondPart = values
      .map((value) => {
        if (value[1] !== undefined) {
          useSecondPart = true;
        }
        return value[1] || value[0];
      })
      .join(" ");

    return useSecondPart ? `${firstPart} / ${secondPart}` : firstPart;
  }

  /**
   * If all the declaration values are equal
   */
  private get allValuesEqual() {
    return this.values.every((value) => this.areEqual(value, this.a));
  }

  /**
   * If all the declaration values are important
   */
  private get allValuesImportant() {
    return this.values.every((value) => !!value.important);
  }

  private get someValuesImportant() {
    return this.values.some((value) => !!value.important);
  }

  /**
   * Test if two declarations are equal to each-other
   */
  private areEqual(a: Declaration, b: Declaration) {
    return a.value === b.value && a.important === b.important;
  }
}
