import { Result, AggregateRoot, Entity, DomainEvent } from './index';

describe('Shared Kernel', () => {
  it('Result.ok creates a successful result', () => {
    const result = Result.ok(42);
    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    expect(result.getValue()).toBe(42);
  });

  it('Result.fail creates a failed result', () => {
    const result = Result.fail('SOME_ERROR');
    expect(result.isFailure()).toBe(true);
    expect(result.isSuccess()).toBe(false);
    expect(result.getError()).toBe('SOME_ERROR');
  });

  it('Entity requires id property', () => {
    class TestEntity extends Entity {
      readonly id = 'abc';
    }
    const entity = new TestEntity();
    expect(entity.id).toBe('abc');
  });

  it('AggregateRoot records and pulls domain events', () => {
    class TestEvent extends DomainEvent {
      constructor() { super('test.event'); }
    }
    class TestAggregate extends AggregateRoot {
      addEvent() { this.recordEvent(new TestEvent()); }
    }
    const agg = new TestAggregate();
    agg.addEvent();
    const events = agg.pullEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('test.event');
    expect(agg.pullEvents().length).toBe(0);
  });
});
