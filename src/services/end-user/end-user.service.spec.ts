import { Test, TestingModule } from '@nestjs/testing';
import { EndUserService } from './end-user.service';

describe('EndUserService', () => {
  let service: EndUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EndUserService],
    }).compile();

    service = module.get<EndUserService>(EndUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
