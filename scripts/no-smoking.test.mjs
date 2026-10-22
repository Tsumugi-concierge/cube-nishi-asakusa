import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const languages = ['en', 'ja', 'zh', 'ko', 'fr', 'es'];
const balconies = { en: /balconies/, ja: /バルコニー/, zh: /阳台/, ko: /발코니/, fr: /balcons/, es: /balcones/ };
for (const page of ['smoking', 'house-rules']) {
  const html = readFileSync(new URL(`../${page}/index.html`, import.meta.url), 'utf8');
  const source = html.match(/const S=\{[\s\S]*?\n\};/);
  assert.ok(source, `${page}: translations exist`);
  const translations = vm.runInNewContext(`${source[0]}\nS`, {}, { timeout: 1000 });
  assert.deepEqual(Object.keys(translations), languages);
  for (const lang of languages) {
    const text = translations[lang][page === 'smoking' ? 'sm2' : 'hr3'];
    assert.match(text, balconies[lang], `${page}/${lang}: includes balconies`);
  }
  // The old embedded diagrams explicitly allowed smoking on the 3F balcony.
  assert.doesNotMatch(html, /<img[^>]+src="data:image\//);
  assert.doesNotMatch(html, /only permitted|only allowed|3rd-floor balcony|3階バルコニーのみ|3楼阳台吸烟|3층 발코니에서만|uniquement autorisé|Solo se permite fumar/);
  console.log(`${page}: all six languages prohibit balcony smoking; old image removed`);
}
const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /href="smoking\/"[\s\S]*?&#x1F6AD;/);
console.log('home: no-smoking icon');
