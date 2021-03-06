/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

jest.mock('nodegit');
jest.mock('azure-devops-node-api/GitApi');
jest.mock('azure-devops-node-api/interfaces/GitInterfaces');
jest.mock('./helpers', () => ({
  pushToRemoteUserPass: jest.fn(),
}));

import { AzurePublisher } from './azure';
import { GitApi } from 'azure-devops-node-api/GitApi';
import { pushToRemoteUserPass } from './helpers';

const { mockGitApi } = require('azure-devops-node-api/GitApi') as {
  mockGitApi: {
    createRepository: jest.MockedFunction<GitApi['createRepository']>;
  };
};

describe('Azure Publisher', () => {
  const publisher = new AzurePublisher(new GitApi('', []), 'fake-token');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publish: createRemoteInAzure', () => {
    it('should use azure-devops-node-api to create a repo in the given project', async () => {
      mockGitApi.createRepository.mockResolvedValue({
        remoteUrl: 'https://dev.azure.com/organization/project/_git/repo',
      } as { remoteUrl: string });

      const result = await publisher.publish({
        values: {
          storePath: 'project/repo',
          owner: 'bob',
        },
        directory: '/tmp/test',
      });

      expect(result).toEqual({
        remoteUrl: 'https://dev.azure.com/organization/project/_git/repo',
        catalogInfoUrl:
          'https://dev.azure.com/organization/project/_git/repo?path=%2Fcatalog-info.yaml',
      });
      expect(mockGitApi.createRepository).toHaveBeenCalledWith(
        {
          name: 'repo',
        },
        'project',
      );
      expect(pushToRemoteUserPass).toHaveBeenCalledWith(
        '/tmp/test',
        'https://dev.azure.com/organization/project/_git/repo',
        'notempty',
        'fake-token',
      );
    });
  });
});
