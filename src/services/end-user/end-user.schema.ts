import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, ObjectId } from 'mongoose';

export type EndUserDocument = HydratedDocument<EndUser>;

@Schema({
  collection: 'endusers',
  timestamps: true,
})
export class EndUser {
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
        message: 'Name is too short',
      },
      {
        type: 'maxLength',
        constraint1: 30,
        message: 'Name is too long',
      },
    ],
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  phone: string;

  @Prop({
    type: String,
    required: true,
  })
  pan: string;

  @Prop({
    type: String,
    required: true,
  })
  amb: string;
}

export const EndUserSchema = SchemaFactory.createForClass(EndUser);
