import type { ValidationError } from 'class-validator';

/**
 * O `class-validator` gera mensagens padrão em inglês. Como a API é entregue em
 * pt-BR, a tradução acontece aqui — a partir do nome da constraint — em vez de
 * repetir a opção `message` em cada decorator dos DTOs.
 */
const MENSAGENS_SIMPLES: Record<string, (campo: string) => string> = {
  arrayNotEmpty: (campo) => `${campo} deve conter pelo menos um item.`,
  isArray: (campo) => `${campo} deve ser uma lista.`,
  isBoolean: (campo) => `${campo} deve ser verdadeiro ou falso.`,
  isDateString: (campo) => `${campo} deve ser uma data válida.`,
  isEmail: (campo) => `${campo} deve ser um e-mail válido.`,
  isInt: (campo) => `${campo} deve ser um número inteiro.`,
  isNotEmpty: (campo) => `${campo} não pode ficar vazio.`,
  isNumber: (campo) => `${campo} deve ser um número.`,
  isPositive: (campo) => `${campo} deve ser maior que zero.`,
  isString: (campo) => `${campo} deve ser um texto.`,
  isUrl: (campo) => `${campo} deve ser uma URL válida.`,
  isUuid: (campo) => `${campo} deve ser um UUID válido.`,
  whitelistValidation: (campo) => `${campo} não é uma propriedade permitida.`,
};

/**
 * Regras com parâmetro (valor mínimo, máximo, lista de opções) só expõem o
 * parâmetro dentro da mensagem padrão em inglês. Extraímos esse trecho final
 * para não perder a informação mais útil da validação.
 */
const MENSAGENS_PARAMETRIZADAS: Record<
  string,
  { padrao: RegExp; comParametro: (campo: string, valor: string) => string }
> = {
  isEnum: {
    padrao: /values:\s*(.+)$/,
    comParametro: (campo, valor) => `${campo} deve ser um dos valores: ${valor}.`,
  },
  max: {
    padrao: /(-?\d+(?:\.\d+)?)\s*$/,
    comParametro: (campo, valor) => `${campo} não pode ser maior que ${valor}.`,
  },
  maxLength: {
    padrao: /(\d+)\s*characters?$/,
    comParametro: (campo, valor) => `${campo} deve ter no máximo ${valor} caracteres.`,
  },
  min: {
    padrao: /(-?\d+(?:\.\d+)?)\s*$/,
    comParametro: (campo, valor) => `${campo} não pode ser menor que ${valor}.`,
  },
  minLength: {
    padrao: /(\d+)\s*characters?$/,
    comParametro: (campo, valor) => `${campo} deve ter no mínimo ${valor} caracteres.`,
  },
};

function traduzirConstraint(constraint: string, mensagemPadrao: string, campo: string): string {
  const simples = MENSAGENS_SIMPLES[constraint];
  if (simples) {
    return simples(campo);
  }

  const parametrizada = MENSAGENS_PARAMETRIZADAS[constraint];
  if (parametrizada) {
    const parametro = parametrizada.padrao.exec(mensagemPadrao)?.[1];
    if (parametro) {
      return parametrizada.comParametro(campo, parametro.trim());
    }
  }

  // Regra sem tradução mapeada: devolve uma mensagem genérica em pt-BR em vez
  // de vazar o texto padrão em inglês do class-validator.
  return `${campo} possui um valor inválido.`;
}

/**
 * Achata a árvore de erros do `class-validator` em mensagens pt-BR, preservando
 * o caminho do campo (`endereco.cidade`) para erros aninhados.
 */
export function formatValidationErrors(errors: ValidationError[], caminhoPai = ''): string[] {
  const mensagens: string[] = [];

  for (const error of errors) {
    const campo = caminhoPai ? `${caminhoPai}.${error.property}` : error.property;

    for (const [constraint, mensagemPadrao] of Object.entries(error.constraints ?? {})) {
      mensagens.push(traduzirConstraint(constraint, String(mensagemPadrao), campo));
    }

    if (error.children?.length) {
      mensagens.push(...formatValidationErrors(error.children, campo));
    }
  }

  return mensagens;
}
