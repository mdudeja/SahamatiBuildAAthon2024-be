import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OfferingDocument = HydratedDocument<Offering>;

@Schema({
  timestamps: true,
})
export class Offering {
  @Prop({
    type: String,
    required: true,
    enum: ['loan', 'sip', 'fund'],
  })
  offering_type: 'loan' | 'sip' | 'fund';

  @Prop({
    type: Object,
    required: true,
  })
  details: any;
}

export const OfferingSchema = SchemaFactory.createForClass(Offering);
