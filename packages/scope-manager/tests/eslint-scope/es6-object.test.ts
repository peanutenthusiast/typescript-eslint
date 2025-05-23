import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ScopeType } from '../../src/index.js';
import { getRealVariables, parseAndAnalyze } from '../test-utils/index.js';

describe('ES6 object', () => {
  it('method definition', () => {
    const { scopeManager } = parseAndAnalyze(`
      ({
        constructor() {
        }
      })
    `);

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];
    let variables = getRealVariables(scope.variables);
    assert.isScopeOfType(scope, ScopeType.global);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBe(false);

    scope = scopeManager.scopes[1];
    variables = getRealVariables(scope.variables);
    assert.isScopeOfType(scope, ScopeType.function);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
    expect(scope.isStrict).toBe(false);
    expect(variables).toHaveLength(1);
    expect(variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });

  it('computed property key may refer variables', () => {
    const { scopeManager } = parseAndAnalyze(`
      (function () {
        var yuyushiki = 42;
        ({
          [yuyushiki]() {
          },

          [yuyushiki + 40]() {
          }
        })
      }());
    `);

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];
    let variables = getRealVariables(scope.variables);
    assert.isScopeOfType(scope, ScopeType.global);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBe(false);

    scope = scopeManager.scopes[1];
    variables = getRealVariables(scope.variables);
    assert.isScopeOfType(scope, ScopeType.function);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
    expect(scope.isStrict).toBe(false);
    expect(variables).toHaveLength(2);
    expect(variables[0].name).toBe('arguments');
    expect(variables[1].name).toBe('yuyushiki');
    expect(scope.references).toHaveLength(3);
    expect(scope.references[0].identifier.name).toBe('yuyushiki');
    expect(scope.references[1].identifier.name).toBe('yuyushiki');
    expect(scope.references[2].identifier.name).toBe('yuyushiki');
  });
});
