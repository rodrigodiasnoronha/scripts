import axios from 'axios';
import { Feriado } from './Feriados';

const brasilApi = axios.create({
  baseURL: 'https://brasilapi.com.br/api',
});

export const getFeriados = async (ano: string) => {
  return brasilApi.get<Array<Feriado>>(`/feriados/v1/${ano}`);
};