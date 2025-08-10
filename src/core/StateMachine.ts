/**
 * State Machine for managing game states and transitions
 * Provides enter/exit/update lifecycle with stack-based state management
 */

export interface State {
  enter(data?: any): void;
  exit(): void;
  update(time: number, delta: number): void;
  pause?(): void;
  resume?(): void;
}

export interface StateTransition {
  from: string;
  to: string;
  data?: any;
}

export class StateMachine {
  private states: Map<string, State> = new Map();
  private stateStack: string[] = [];
  private currentState: State | null = null;
  private currentStateName: string | null = null;
  private transitions: StateTransition[] = [];

  /**
   * Register a state in the state machine
   */
  addState(name: string, state: State): void {
    this.states.set(name, state);
    console.log(`📋 State registered: ${name}`);
  }

  /**
   * Push a new state onto the stack (pause current state)
   */
  pushState(name: string, data?: any): boolean {
    const state = this.states.get(name);
    if (!state) {
      console.warn(`⚠️ State not found: ${name}`);
      return false;
    }

    // Pause current state if it supports pausing
    if (this.currentState && this.currentState.pause) {
      this.currentState.pause();
      console.log(`⏸️ Paused state: ${this.currentStateName}`);
    }

    // Push current state to stack
    if (this.currentStateName) {
      this.stateStack.push(this.currentStateName);
    }

    // Transition to new state
    this.transitionTo(name, state, data);
    this.logTransition('push', name);
    return true;
  }

  /**
   * Replace current state without affecting the stack
   */
  replaceState(name: string, data?: any): boolean {
    const state = this.states.get(name);
    if (!state) {
      console.warn(`⚠️ State not found: ${name}`);
      return false;
    }

    // Exit current state
    if (this.currentState) {
      this.currentState.exit();
    }

    // Transition to new state
    this.transitionTo(name, state, data);
    this.logTransition('replace', name);
    return true;
  }

  /**
   * Pop current state and return to previous state
   */
  popState(): boolean {
    if (this.stateStack.length === 0) {
      console.warn('⚠️ Cannot pop state: stack is empty');
      return false;
    }

    // Exit current state
    if (this.currentState) {
      this.currentState.exit();
    }

    // Get previous state from stack
    const previousStateName = this.stateStack.pop()!;
    const previousState = this.states.get(previousStateName);

    if (!previousState) {
      console.error(`❌ Previous state not found: ${previousStateName}`);
      return false;
    }

    // Resume previous state
    this.currentState = previousState;
    this.currentStateName = previousStateName;

    if (previousState.resume) {
      previousState.resume();
      console.log(`▶️ Resumed state: ${previousStateName}`);
    }

    this.logTransition('pop', previousStateName);
    return true;
  }

  /**
   * Update current state
   */
  update(time: number, delta: number): void {
    if (this.currentState) {
      this.currentState.update(time, delta);
    }
  }

  /**
   * Get current state name
   */
  getCurrentState(): string | null {
    return this.currentStateName;
  }

  /**
   * Get state stack depth
   */
  getStackDepth(): number {
    return this.stateStack.length;
  }

  /**
   * Check if a specific state is in the stack
   */
  isStateInStack(name: string): boolean {
    return this.stateStack.includes(name);
  }

  /**
   * Clear all states and reset
   */
  reset(): void {
    if (this.currentState) {
      this.currentState.exit();
    }
    
    this.currentState = null;
    this.currentStateName = null;
    this.stateStack.length = 0;
    this.transitions.length = 0;
    
    console.log('🔄 State machine reset');
  }

  /**
   * Get transition history (for debugging)
   */
  getTransitionHistory(): StateTransition[] {
    return [...this.transitions];
  }

  /**
   * Internal transition logic
   */
  private transitionTo(name: string, state: State, data?: any): void {
    this.currentState = state;
    this.currentStateName = name;
    state.enter(data);
  }

  /**
   * Log transition for debugging
   */
  private logTransition(type: 'push' | 'replace' | 'pop', toState: string): void {
    const transition: StateTransition = {
      from: this.transitions.length > 0 ? this.transitions[this.transitions.length - 1].to : 'none',
      to: toState
    };
    
    this.transitions.push(transition);
    
    console.log(`🔄 State ${type}: ${transition.from} -> ${toState} (stack: ${this.stateStack.length})`);
  }
}

/**
 * Runtime test function for StateMachine
 */
export function testStateMachine(): boolean {
  console.log('🧪 Running StateMachine tests...');

  const stateMachine = new StateMachine();
  let testResults: boolean[] = [];

  // Mock states for testing
  class MockState implements State {
    public name: string;
    
    constructor(name: string) {
      this.name = name;
    }
    
    enter(data?: any) { console.log(`Enter ${this.name}`, data); }
    exit() { console.log(`Exit ${this.name}`); }
    update() { /* no-op */ }
    pause() { console.log(`Pause ${this.name}`); }
    resume() { console.log(`Resume ${this.name}`); }
  }

  // Test 1: Basic state registration and transition
  try {
    const state1 = new MockState('Test1');
    const state2 = new MockState('Test2');
    
    stateMachine.addState('test1', state1);
    stateMachine.addState('test2', state2);
    
    stateMachine.replaceState('test1');
    testResults.push(stateMachine.getCurrentState() === 'test1');
    
    console.log('✅ Test 1 passed: Basic state management');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    testResults.push(false);
  }

  // Test 2: Stack operations
  try {
    stateMachine.pushState('test2');
    testResults.push(stateMachine.getCurrentState() === 'test2');
    testResults.push(stateMachine.getStackDepth() === 1);
    
    stateMachine.popState();
    testResults.push(stateMachine.getCurrentState() === 'test1');
    testResults.push(stateMachine.getStackDepth() === 0);
    
    console.log('✅ Test 2 passed: Stack operations');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    testResults.push(false);
  }

  // Test 3: Error handling
  try {
    const invalidResult = stateMachine.replaceState('nonexistent');
    testResults.push(!invalidResult); // Should return false
    
    const popResult = stateMachine.popState(); // Empty stack
    testResults.push(!popResult); // Should return false
    
    console.log('✅ Test 3 passed: Error handling');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
    testResults.push(false);
  }

  const allPassed = testResults.every(result => result);
  console.log(`🧪 StateMachine tests completed: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
  
  return allPassed;
}
