/** Register bundled fonts with base-path-correct URLs (GitHub Pages safe). */
function addFontFace(family: string, file: string) {
  const style = document.createElement('style')
  style.textContent = `@font-face {
  font-family: '${family}';
  src: url('${import.meta.env.BASE_URL}fonts/${file}') format('truetype');
  font-display: block;
}`
  document.head.appendChild(style)
}

addFontFace('Visa Dialect Light', 'visa-dialect-light.ttf')
addFontFace('Visa Dialect Regular', 'visa-dialect-regular.ttf')
