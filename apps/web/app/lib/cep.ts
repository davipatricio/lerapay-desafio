export interface ViaCepAddress {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface CepAddress {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

export class CepLookupError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CepLookupError';
  }
}

/** Looks up a Brazilian CEP and returns only the fields used by registration. */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepAddress> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new CepLookupError('Informe um CEP válido com 8 dígitos.');
  }

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new CepLookupError('Não foi possível consultar o CEP agora.');
  }

  if (!response.ok) {
    throw new CepLookupError('Não foi possível consultar o CEP agora.');
  }

  const data = (await response.json()) as ViaCepAddress;
  if (data.erro) {
    throw new CepLookupError('CEP não encontrado. Confira o número informado.');
  }

  return {
    address: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
}
