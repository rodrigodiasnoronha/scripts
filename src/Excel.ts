import XLSX, { WorkBook } from "xlsx";
import fs, { WriteStream } from "fs";
import path from "path";

export interface ExcelFinalBaseColumns {
    index: number;
    "NOME ": string;
    "LOTACAO ": string;
    "GRUPO ": string;
    "CHEFE IMEDIATO": string;
    "CARGO ": string;
    PARES: string;
    MAT: string;
}

export class Excel {
    private usersSqlFile: WriteStream;
    private lotacaoSqlFile: WriteStream;
    private grupoSqlFile: WriteStream;
    private cargoSqlFile: WriteStream;
    private userBossSqlFile: WriteStream;
    private userLotacaoSqlFile: WriteStream;
    private userCargoGrupoSqlFile: WriteStream;

    private workbook: WorkBook;
    private worksheet: ExcelFinalBaseColumns[];
    private sheetName: string;
    private lotacoes: ExcelFinalBaseColumns[];
    private grupos: ExcelFinalBaseColumns[];
    private cargos: ExcelFinalBaseColumns[];

    private distDir: string = path.resolve(__dirname, "dist");
    private excelDir: string = path.resolve(__dirname, "assets", "BASE COM PARES E CHEFE IMEDIATO_03102024.xlsx");

    constructor() {
        // abre/cria o arquivo SQL
        this.usersSqlFile = fs.createWriteStream(path.join(this.distDir, "users.sql"));
        this.lotacaoSqlFile = fs.createWriteStream(path.join(this.distDir, "lotacao.sql"));
        this.grupoSqlFile = fs.createWriteStream(path.join(this.distDir, "grupo.sql"));
        this.cargoSqlFile = fs.createWriteStream(path.join(this.distDir, "cargo.sql"));
        this.userBossSqlFile = fs.createWriteStream(path.join(this.distDir, "user_boss.sql"));
        this.userLotacaoSqlFile = fs.createWriteStream(path.join(this.distDir, "user_lotacao.sql"));
        this.userCargoGrupoSqlFile = fs.createWriteStream(path.join(this.distDir, "user_cargo_grupo.sql"));

        // lê arquivo excel
        this.workbook = XLSX.readFile(this.excelDir);
        this.sheetName = this.workbook.SheetNames[0]; // Pega a primeira planilha
        this.worksheet = XLSX.utils.sheet_to_json<ExcelFinalBaseColumns>(this.workbook.Sheets[this.sheetName]);
        this.worksheet = this.addIndexToWorksheetItems(this.worksheet);

        // carrega lotações/grupos/cargos
        this.lotacoes = this.loadLotacoes();
        this.grupos = this.loadGrupos();
        this.cargos = this.loadCargos();
    }

    private addIndexToWorksheetItems(worksheet: Array<ExcelFinalBaseColumns>): Array<ExcelFinalBaseColumns> {
        return worksheet.map((item, index) => {
            return { ...item, index: index + 1 };
        });
    }

    /**
     *
     * Carrega as lotações do usuários
     *
     * @private
     */
    private loadLotacoes(): Array<ExcelFinalBaseColumns> {
        const lotacoes: Array<ExcelFinalBaseColumns> = [];

        let index = 1;
        for (const row of this.worksheet) {
            const isAlreadyAdded: boolean = lotacoes.some(lot => lot.PARES == row.PARES);

            if (!isAlreadyAdded) {
                lotacoes.push({ ...row, index: index });
                index = index + 1;
            }
        }
        return lotacoes;
    }

    /**
     *
     * Carrega cargos
     *
     * @private
     *
     */
    private loadCargos(): Array<ExcelFinalBaseColumns> {
        const cargos: Array<ExcelFinalBaseColumns> = [];

        let index = 1;
        for (const row of this.worksheet) {
            const isAlreadyAdded: boolean = cargos.some(lot => lot["CARGO "] == row["CARGO "]);

            if (!isAlreadyAdded) {
                cargos.push({ ...row, index: index });
                index = index + 1;
            }
        }

        return cargos;
    }


    /**
     *
     * Carrega grupos de acordo com a planilha
     *
     * @private
     */
    private loadGrupos(): Array<ExcelFinalBaseColumns> {
        const grupos: Array<ExcelFinalBaseColumns> = [];

        let index = 1;
        for (const row of this.worksheet) {
            const isAlreadyAdded: boolean = grupos.some(lot => lot["GRUPO "] == row["GRUPO "]);

            if (!isAlreadyAdded) {
                grupos.push({ ...row, index: index });
                index = index + 1;
            }
        }

        return grupos;
    }

    /**
     *
     * Escreve SQL no arquivo users.sql
     *
     * @private
     */
    private writeUserSqlFile() {
        for (const user of this.worksheet) {
            const sql = `INSERT INTO user_management.users (id, created_at, updated_at, deleted_at, deleted, name, cpf, email, registration, username) VALUES (${user.index}, '2024-10-03 00:00:12.055777 +00:00', null, null, false, '${user["NOME "]}', null, null, '${user.MAT}', '{${user.MAT}}');\n`;
            this.usersSqlFile.write(sql);
        }
    }


    /**
     *
     *
     * Escreve SQL no arquivo user_boss.sql
     *
     * @private
     */
    private writeUserBossSqlFile() {
        for (const user of this.worksheet) {
            const hasUserChefeImediato: boolean = !!user["CHEFE IMEDIATO"];

            if (hasUserChefeImediato) {
                const boss = this.worksheet.find(item => item.MAT == user["CHEFE IMEDIATO"]);

                if (!boss) {
                    throw new Error(`Boss not found for user mat: ${user.MAT} | ${user["NOME "]}`);
                }

                const sql = `INSERT INTO user_management.user_boss (created_at, updated_at, deleted_at, deleted, boss_id, user_id) VALUES ('2024-10-03 00:00:54.380207 +00:00', null, null, false, ${boss.index}, ${user.index});\n`;
                this.userBossSqlFile.write(sql);
            }
        }
    }

    /**
     *
     * Escrever SQL user_cargo.sql
     *
     * @private
     */
    private writeUserCargoGrupoSqlFile() {
        for (const user of this.worksheet) {
            1;
            const userGrupo = this.grupos.find(grupo => grupo["GRUPO "] == user["GRUPO "]);
            const userCargo = this.cargos.find(cargo => cargo["CARGO "] == user["CARGO "]);

            if (!userGrupo) {
                throw new Error(`User group not found for user mat: ${user.MAT} | ${user["NOME "]}`);
            }

            if (!userCargo) {
                throw new Error(`User cargo not found for user mat: ${user.MAT} | ${user["NOME "]}`);
            }

            const sql = `INSERT INTO user_management.user_cargo_grupo (created_at, updated_at, deleted_at, deleted, cargo_id, user_id, grupo_id) VALUES ('2024-09-09 17:55:48.178290 +00:00', null, null, false, ${userCargo.index}, ${user.index}, ${userGrupo.index});\n`;
            this.userCargoGrupoSqlFile.write(sql);
        }
    }

    /**
     *
     * Escrever SQL user_lotacao.sql
     *
     * @private
     */
    private writeUserLotacaoSqlFile() {
        for (const user of this.worksheet) {
            const sql = `INSERT INTO user_management.user_lotacao (created_at, updated_at, deleted_at, deleted, lotacao_id, user_id) VALUES ('2024-09-09 17:38:18.434675 +00:00', null, null, false, ${user.PARES}, ${user.index});\n`;
            this.userLotacaoSqlFile.write(sql);
        }
    }

    /**

     *
     * Escreve SQL no arquivo lotacao.sql
     * Diretoria = Lotação
     *
     */
    private writeLotacaoSqlFile() {
        for (const lotacao of this.lotacoes) {
            const sql = `INSERT INTO user_management.lotacao (id, lotacao, created_at, updated_at, deleted_at, deleted) VALUES (${lotacao.PARES}, '${lotacao["LOTACAO "]}', '2024-03-10 00:00:09.953589 +00:00', null, null, false);\n`;
            this.lotacaoSqlFile.write(sql);
        }
    }

    /**
     *
     * Grupos dos usuários
     *
     * @private
     */
    private writeGrupoSqlFile() {
        for (const grupo of this.grupos) {
            const sql = `INSERT INTO user_management.grupo (id, grupo, created_at, updated_at, deleted_at, deleted) VALUES (${grupo.index}, '${grupo["GRUPO "]}', '2024-03-10 00:00:14.611472 +00:00', null, null, false)\n`;
            this.grupoSqlFile.write(sql);
        }
    }

    /**
     *
     * Escreve SQL do arquivo
     *
     * cargo.sql
     *
     * @private
     */
    private writeCargoSqlFile() {
        for (const cargo of this.cargos) {
            const sql = `INSERT INTO user_management.cargo (id, cargo, created_at, updated_at, deleted_at, deleted) VALUES (${cargo.index}, '${cargo["CARGO "]}', '2024-03-10 00:00:50.972880 +00:00', null, null, false);\n`;
            this.cargoSqlFile.write(sql);
        }
    }

    public writeSqlFiles(): void {
        this.writeUserSqlFile();
        this.writeLotacaoSqlFile();
        this.writeGrupoSqlFile();
        this.writeCargoSqlFile();
        this.writeUserBossSqlFile();
        this.writeUserLotacaoSqlFile();
        this.writeUserCargoGrupoSqlFile();
    }


    public closeFiles() {
        this.usersSqlFile.end(() => console.log("Escrita arquivo users.sql com sucesso"));
        this.lotacaoSqlFile.end(() => console.log("Escrita lotacao.sql com sucesso"));
        this.grupoSqlFile.end(() => console.log("Escrita grupo.sql com sucesso"));
        this.cargoSqlFile.end(() => console.log("Escrita cargo.sql com sucesso"));
        this.userBossSqlFile.end(() => console.log("Escrita user_boss.sql com sucesso"));
        this.userLotacaoSqlFile.end(() => console.log("Escrita user_lotacao.sql com sucesso"));
        this.userCargoGrupoSqlFile.end(() => console.log("Escrita user_cargo.sql com sucesso"));
    }
}