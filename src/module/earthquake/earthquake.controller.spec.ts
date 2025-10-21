import { Test, type TestingModule } from '@nestjs/testing';
import { EarthquakeController } from './earthquake.controller';
import { EarthquakeService } from './earthquake.service';
import { RequestLogService } from '@/module/logging/request-log.service';

describe('EarthquakeController', () => {
  let controller: EarthquakeController;

  beforeEach(async () => {
    const earthquakeServiceMock = {
      fetchAndStoreRecentEarthquakes: jest.fn(),
      listEarthquakes: jest.fn(),
    };
    const requestLogServiceMock = {
      getRequestCountsByDay: jest.fn(),
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarthquakeController],
      providers: [
        { provide: EarthquakeService, useValue: earthquakeServiceMock },
        { provide: RequestLogService, useValue: requestLogServiceMock },
      ],
    }).compile();

    controller = module.get<EarthquakeController>(EarthquakeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
