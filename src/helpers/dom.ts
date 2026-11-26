import type { Locator, Page } from '@playwright/test';

/** Set value on React-controlled inputs the way the C# ReactInput helper does. */
export async function setReactInput(page: Page, input: Locator, value: string): Promise<void> {
  await input.scrollIntoViewIfNeeded();
  await input.evaluate((el, nextValue) => {
    const element = el as HTMLInputElement | HTMLTextAreaElement;
    element.focus();
    const proto =
      element.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(element, '');
    element.dispatchEvent(new Event('input', { bubbles: true }));
    if (desc?.set) desc.set.call(element, nextValue);
    else element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    try {
      element.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: nextValue, inputType: 'insertText' }),
      );
    } catch {
      /* older browsers */
    }
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    element.blur();
  }, value);

  const actual = await input.inputValue().catch(() => '');
  if (actual !== value) {
    await input.fill(value);
  }
}

export async function bodyText(page: Page): Promise<string> {
  try {
    return await page.locator('body').innerText();
  } catch {
    return '';
  }
}

export async function waitUntil(
  page: Page,
  condition: () => Promise<boolean>,
  timeoutSeconds = 20,
): Promise<boolean> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    try {
      if (await condition()) return true;
    } catch {
      /* retry */
    }
    await page.waitForTimeout(200);
  }
  return false;
}

export function xpathLiteral(value: string): string {
  return value.includes("'") ? `"${value}"` : `'${value}'`;
}
