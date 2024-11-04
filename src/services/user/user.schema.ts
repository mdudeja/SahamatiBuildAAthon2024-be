import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, ObjectId } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    type: mongoose.Types.ObjectId,
    auto: true,
  })
  _id: ObjectId;

  @Prop({
    type: String,
    required: true,
    validators: [
      {
        type: 'minLength',
        constraint1: 3,
        message: 'Username is too short',
      },
      {
        type: 'maxLength',
        constraint1: 30,
        message: 'Username is too long',
      },
    ],
  })
  username: string;

  @Prop({
    type: String,
    validators: [
      {
        type: 'minLength',
        constraint1: 8,
        message: 'Password is too short',
      },
      {
        type: 'maxLength',
        constraint1: 30,
        message: 'Password is too long',
      },
    ],
  })
  password: string;

  @Prop({
    type: String,
    required: true,
    enum: ['fiu', 'client'],
  })
  userType: 'fiu' | 'client';
}

export const UserSchema = SchemaFactory.createForClass(User);
