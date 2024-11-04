import { Test, TestingModule } from '@nestjs/testing';
import { OfferingService } from './offering.service';

describe('OfferingService', () => {
  let service: OfferingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfferingService],
    }).compile();

    service = module.get<OfferingService>(OfferingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
