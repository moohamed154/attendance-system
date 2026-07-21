import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(public readonly page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string = 'password123') {
    await this.page.getByTestId('username-input').fill(username);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('login-button').click();
  }

  async verifySuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async verifyError() {
    await expect(this.page.locator('text=Invalid username or password').or(this.page.locator('text=Invalid credentials'))).toBeVisible();
  }
}
