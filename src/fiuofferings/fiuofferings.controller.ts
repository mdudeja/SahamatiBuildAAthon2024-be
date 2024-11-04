import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FiuofferingsService } from './fiuofferings.service';
import { Offering } from 'src/services/offering/offering.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('fiuofferings')
export class FiuofferingsController {
  constructor(private readonly fiuofferingsService: FiuofferingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  async createOffering(@Body() body: Offering): Promise<any> {
    return this.fiuofferingsService.createOffering(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/bytype/:type')
  async getOfferingsByType(@Param('type') type: string): Promise<any> {
    return this.fiuofferingsService.getOfferingsByType(type);
  }
}
