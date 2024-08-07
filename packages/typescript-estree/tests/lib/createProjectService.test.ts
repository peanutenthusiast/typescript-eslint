import * as ts from 'typescript';

import { createProjectService } from '../../src/create-program/createProjectService';

const mockReadConfigFile = jest.fn();
const mockSetCompilerOptionsForInferredProjects = jest.fn();
const mockSetHostConfiguration = jest.fn();

jest.mock('typescript/lib/tsserverlibrary', () => ({
  ...jest.requireActual('typescript/lib/tsserverlibrary'),
  readConfigFile: mockReadConfigFile,
  server: {
    ProjectService: class {
      setCompilerOptionsForInferredProjects =
        mockSetCompilerOptionsForInferredProjects;
      setHostConfiguration = mockSetHostConfiguration;
    },
  },
}));

describe('createProjectService', () => {
  it('sets allowDefaultProjectForFiles when options.allowDefaultProjectForFiles is defined', () => {
    const allowDefaultProjectForFiles = ['./*.js'];
    const settings = createProjectService(
      { allowDefaultProjectForFiles },
      undefined,
    );

    expect(settings.allowDefaultProjectForFiles).toBe(
      allowDefaultProjectForFiles,
    );
  });

  it('does not set allowDefaultProjectForFiles when options.allowDefaultProjectForFiles is not defined', () => {
    const settings = createProjectService(undefined, undefined);

    expect(settings.allowDefaultProjectForFiles).toBeUndefined();
  });

  it('throws an error when options.defaultProject is set and readConfigFile returns an error', () => {
    mockReadConfigFile.mockReturnValue({
      error: {
        category: ts.DiagnosticCategory.Error,
        code: 1234,
        file: ts.createSourceFile('./tsconfig.json', '', {
          languageVersion: ts.ScriptTarget.Latest,
        }),
        start: 0,
        length: 0,
        messageText: 'Oh no!',
      } satisfies ts.Diagnostic,
    });

    expect(() =>
      createProjectService(
        {
          allowDefaultProjectForFiles: ['file.js'],
          defaultProject: './tsconfig.json',
        },
        undefined,
      ),
    ).toThrow(
      /Could not read default project '\.\/tsconfig.json': .+ error TS1234: Oh no!/,
    );
  });

  it('throws an error when options.defaultProject is set and readConfigFile throws an error', () => {
    mockReadConfigFile.mockImplementation(() => {
      throw new Error('Oh no!');
    });

    expect(() =>
      createProjectService(
        {
          allowDefaultProjectForFiles: ['file.js'],
          defaultProject: './tsconfig.json',
        },
        undefined,
      ),
    ).toThrow("Could not parse default project './tsconfig.json': Oh no!");
  });

  it('uses the default projects compiler options when options.defaultProject is set and readConfigFile succeeds', () => {
    const compilerOptions = { strict: true };
    mockReadConfigFile.mockReturnValue({ config: { compilerOptions } });

    const { service } = createProjectService(
      {
        allowDefaultProjectForFiles: ['file.js'],
        defaultProject: './tsconfig.json',
      },
      undefined,
    );

    expect(service.setCompilerOptionsForInferredProjects).toHaveBeenCalledWith(
      compilerOptions,
    );
  });

  it('sets a host configuration', () => {
    const { service } = createProjectService(
      {
        allowDefaultProjectForFiles: ['file.js'],
      },
      undefined,
    );

    expect(service.setHostConfiguration).toHaveBeenCalledWith({
      preferences: {
        includePackageJsonAutoImports: 'off',
      },
    });
  });
});
