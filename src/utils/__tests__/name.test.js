const { toAmericanNameCase } = require('../name');

describe('toAmericanNameCase', () => {
  it('coloca cada palavra com inicial maiuscula e restante minusculo', () => {
    expect(toAmericanNameCase('  jOAO   da  SILVA  ')).toBe('Joao Da Silva');
  });

  it('preserva separadores comuns como hifen e apostrofo', () => {
    expect(toAmericanNameCase("mAria-d'ávila")).toBe("Maria-D'Ávila");
  });
});
