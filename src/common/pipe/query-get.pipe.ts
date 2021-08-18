import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { QueryPreOption } from "src/tools/request.tool";
import { QueryPostOption } from "../../tools/request.tool";

@Injectable()
export class QueryGetPipe implements PipeTransform<QueryPreOption, QueryPostOption> {
    private readonly defaultSortOrder = (field: string): -1 | 1 => (["updatedAt", "createdAt", "_id"].includes(field) ? -1 : 1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform(value: QueryPreOption, metadata: ArgumentMetadata): QueryPostOption {
        // Use default value or not
        // console.log(String(metadata.metatype));
        const isDefault = !value.custom || value.custom === "0";

        // Select fields
        const select = ((selectValue: string): { [field: string]: 0 | 1 } => {
            const res: { [field: string]: 0 | 1 } = {};
            if (selectValue) {
                selectValue.split(" ").forEach((field) => {
                    if (field.charAt(0) === "-") {
                        res[field.slice(1)] = 0;
                    } else {
                        res[field] = 1;
                    }
                });
            }
            return res;
        })(value.select);

        // Sort options
        const fields = ((sort: string): string[] => {
            if (!sort) {
                return isDefault ? ["updatedAt"] : [];
            }
            return sort.split(" ");
        })(value.sort);
        const orders = ((orderString: string, fieldArray: string[]): Array<-1 | 1> => {
            const res: Array<-1 | 1> = orderString ? orderString.split(" ").map((ord) => (ord === "-1" ? -1 : 1)) : [];
            for (let i = res.length; i < fieldArray.length; ++i) {
                res.push(this.defaultSortOrder(fieldArray[i]));
            }
            return res;
        })(value.order, fields);
        const sortOption: { [field: string]: -1 | 1 } = {};
        for (const [i, field] of fields.entries()) {
            sortOption[field] = orders[i];
        }
        sortOption.updatedAt = sortOption.updatedAt || -1;

        // Find conditions
        const conditions = (value.cond && JSON.parse(value.cond)) || {};

        // Pagination
        const page = Number(value.page) || (isDefault ? 1 : undefined);
        const limit = Number(value.limit) || (isDefault ? 20 : undefined);
        const skip = page && (page - 1) * limit;

        const result: QueryPostOption = {
            conditions,
            options: {
                select,
                sort: sortOption,
                skip,
                limit,
            },
        };
        // console.log(result);
        return result;
    }
}
