import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsString, Length } from "class-validator";
import { Document } from "mongoose";
import * as bcrypt from 'bcryptjs';

// constants
import { EGender } from "src/config/constants";
import { USER_CONST } from "./user.constants";

export const USER_MODEL = "users";

@Schema({
    timestamps: true,
    collection: USER_MODEL,
    toJSON: { virtuals: true },
})
export class User {
    @IsString()
    @Prop({
        type: String,
        index: true,
        trim: true,
        maxlength: USER_CONST.NAME_MAX_LENGTH,
    })
    name: string;

    @IsString()
    @Prop({
        type: String,
        index: true,
        required: true,
        trim: true,
    })
    bio: string;

    @IsString()
    @Prop({
        type: String,
        index: true,
        trim: true,
    })
    avatar: string;

    @IsString()
    @Prop({
        type: String,
        index: true,
        trim: true,
    })
    coverPhoto: string;

    @IsString()
    @Length(USER_CONST.USERNAME_MIN_LENGTH, USER_CONST.USERNAME_MAX_LENGTH)
    @Prop({
        type: String,
        index: true,
        required: true,
        trim: true,
    })
    username: string;

    @IsString()
    @Length(USER_CONST.PASSWORD_MIN_LENGTH, USER_CONST.PASSWORD_MAX_LENGTH)
    @Prop({
        type: String,
        index: true,
        required: true,
        trim: true,
    })
    password: string;

    @IsString()
    @Length(USER_CONST.PASSWORD_MIN_LENGTH, USER_CONST.PASSWORD_MAX_LENGTH)
    @Prop({
        type: String,
        index: true,
        required: true,
        trim: true,
    })
    passwordConfirm: string;

    @IsEmail()
    @Prop({
        type: String,
        index: true,
        required: true,
        trim: true,
    })
    email: string;

    @Prop({
        enum: Object.values(EGender)
    })
    gender: EGender;

    @Prop({
        type: Date
    })
    birthday: Date;

    @Prop(
        raw({
            id: {
                type: String,
            },
        }),
    )
    facebook: {
        id: string;
    };

    @Prop(
        raw({
            id: {
                type: String,
            },
        }),
    )
    google: {
        id: string;
    };

    @Prop(
        raw({
            id: {
                type: String,
            },
        }),
    )
    github: {
        id: string;
    };

    @Prop()
    isThirdParty: boolean

    @Prop()
    jti: string;

    comparePassword: (password: string) => Promise<boolean>;
    checkPasswordConfirm: () => boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre("save", async function () {
    if (this.isModified("password")) {
        return;
    }
    const password = this.get('password');
    this.set("password", password ? await bcrypt.hash(password, 10) : null);
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, ((this as unknown) as User).password);
};

UserSchema.methods.checkPasswordConfirm = function () {
    return this.get('password') === this.get('passwordConfirm');
};

export interface UserDocument extends User, Document { }