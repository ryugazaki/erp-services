import { Result } from '@erp/shared/kernel';

export function expectOk<T>(result: Result<T>): T {
  if (result.isFailure()) {
    throw new Error(`Expected success but got error: ${result.getError()}`);
  }
  return result.getValue();
}

export function expectFail<T>(result: Result<T>, expectedCode?: string): string {
  if (result.isSuccess()) {
    throw new Error('Expected failure but got success');
  }
  const error = result.getError();
  if (expectedCode && error !== expectedCode) {
    throw new Error(`Expected error "${expectedCode}" but got "${error}"`);
  }
  return error;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
