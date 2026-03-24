jest.mock('@nestjs/swagger', () => ({
  ApiProperty: jest.fn().mockReturnValue(() => {}),
  ApiPropertyOptional: jest.fn().mockReturnValue(() => {}),
  ApiOkResponse: jest.fn().mockReturnValue(() => {}),
  ApiCreatedResponse: jest.fn().mockReturnValue(() => {}),
  ApiExtraModels: jest.fn().mockReturnValue(() => {}),
  getSchemaPath: jest.fn().mockReturnValue('#/components/schemas/TestDto'),
}));

import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels } from '@nestjs/swagger';
import { OkResponse, CreatedResponse, PaginatedResponse } from './success-response.decorator';

const mockApiOkResponse = ApiOkResponse as jest.MockedFunction<typeof ApiOkResponse>;
const mockApiCreatedResponse = ApiCreatedResponse as jest.MockedFunction<typeof ApiCreatedResponse>;
const mockApiExtraModels = ApiExtraModels as jest.MockedFunction<typeof ApiExtraModels>;

class TestDto {
  id: number;
}

describe('OkResponse decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a decorator function', () => {
    const decorator = OkResponse(TestDto);

    expect(typeof decorator).toBe('function');
  });

  it('calls ApiOkResponse with schema $ref when dataDto is provided', () => {
    OkResponse(TestDto);

    expect(mockApiOkResponse).toHaveBeenCalledWith(
      expect.objectContaining({ schema: expect.objectContaining({ $ref: expect.any(String) }) }),
    );
  });

  it('calls ApiExtraModels with dataDto when dataDto is provided', () => {
    OkResponse(TestDto);

    expect(mockApiExtraModels).toHaveBeenCalledWith(TestDto);
  });

  it('calls ApiOkResponse with empty properties when dataDto is null', () => {
    OkResponse(null);

    expect(mockApiOkResponse).toHaveBeenCalledWith(
      expect.objectContaining({ schema: { properties: {} } }),
    );
  });

  it('does not call ApiExtraModels when dataDto is null', () => {
    OkResponse(null);

    expect(mockApiExtraModels).not.toHaveBeenCalled();
  });
});

describe('CreatedResponse decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a decorator function', () => {
    const decorator = CreatedResponse(TestDto);

    expect(typeof decorator).toBe('function');
  });

  it('calls ApiCreatedResponse with schema $ref when dataDto is provided', () => {
    CreatedResponse(TestDto);

    expect(mockApiCreatedResponse).toHaveBeenCalledWith(
      expect.objectContaining({ schema: expect.objectContaining({ $ref: expect.any(String) }) }),
    );
  });

  it('calls ApiExtraModels with dataDto when dataDto is provided', () => {
    CreatedResponse(TestDto);

    expect(mockApiExtraModels).toHaveBeenCalledWith(TestDto);
  });

  it('does not call ApiExtraModels when dataDto is null', () => {
    CreatedResponse(null);

    expect(mockApiExtraModels).not.toHaveBeenCalled();
  });
});

describe('PaginatedResponse decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a decorator function', () => {
    const decorator = PaginatedResponse(TestDto);

    expect(typeof decorator).toBe('function');
  });

  it('calls ApiExtraModels with PagedResult and the provided dataDto', () => {
    PaginatedResponse(TestDto);

    expect(mockApiExtraModels).toHaveBeenCalledWith(
      expect.anything(),
      TestDto,
    );
  });

  it('calls ApiOkResponse with allOf schema including data array', () => {
    PaginatedResponse(TestDto);

    expect(mockApiOkResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: expect.objectContaining({ allOf: expect.any(Array) }),
      }),
    );
  });
});
