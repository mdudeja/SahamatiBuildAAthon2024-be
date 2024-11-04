import { Test, TestingModule } from '@nestjs/testing';
import { FiuofferingsService } from './fiuofferings.service';

describe('FiuofferingsService', () => {
  let service: FiuofferingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FiuofferingsService],
    }).compile();

    service = module.get<FiuofferingsService>(FiuofferingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
