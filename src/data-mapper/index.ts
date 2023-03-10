export interface DataMapperConfig {
    mappingFn: (tei: any,) => any
}

export class DataMapper {
    private config: DataMapperConfig;

    constructor(config: DataMapperConfig) {
        this.config = config;
    }

    map(data: Array<any>) {
        return data.map((datum) => {
            return this.config.mappingFn(datum)
        })
    }
}
