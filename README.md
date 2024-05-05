# postcss-plugin-merge-border-radius

A [PostCSS](https://github.com/postcss/postcss) plugin that collapses long-hand border-radius properties.

## Installing & Usage

```bash
npm install --save-dev postcss-plugin-merge-border-radius
```

Then follow the [PostCSS](https://github.com/postcss/postcss?tab=readme-ov-file#usage) instructions for installing plugins.

## Examples

**Input:**

```css
.some-class {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
}
```

**Output:**

```css
.some-class {
  border-radius: 10px;
}
```
