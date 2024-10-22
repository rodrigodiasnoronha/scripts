import { WriteStream } from "fs";
import { getFeriados } from "./brasil-api";
import fs from 'fs'
import path from 'path'


export interface Feriado {
    date: Date;
    name: string
    type: string
}

export class Feriados {
    private feriados: Array<Feriado> = []
    private anos: Array<string> = ['2024', '2025', '2026', '2027']
    private feriadosSqlFile: WriteStream;
    private distDir: string = path.resolve(__dirname, "dist");



    constructor() {
        this.feriadosSqlFile = fs.createWriteStream(path.join(this.distDir, "feriados.sql"));

    }

    async gerarSqlFeriados() {
        this.anos.map(async ano => {
            const { data: feriadosDoAno } = await getFeriados(ano)

            feriadosDoAno.map(f => {
                const sql = `INSERT INTO sisjur.feriados (descricao, data, type, fg_ativo) VALUES ('${f.name}', '${f.date}', '${f.type}', true);\n`;
                this.feriadosSqlFile.write(sql);
            })
        })
    }
}