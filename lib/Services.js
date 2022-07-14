import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { mapValues } from 'lodash';

import { useAuth } from './Auth';
import { useMatrix } from './Matrix';

const useServicesProvider = (activeMatrixAuthenticationProviders, services) => {
    return mapValues(activeMatrixAuthenticationProviders, (authenticationProvider, type) => ((authenticationProvider) => {
        return (application, matrix) => {
            const [isLooking, setIsLooking] = useState(false);
            const [error, setError] = useState('');
            const [serviceSpace, setServiceSpace] = useState(null);
            // const auth = useAuth();
            // const matrix = useMatrix(authenticationProvider);
            // const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
            const matrixClient = authenticationProvider.getMatrixClient();

            const matrixSpaces = matrix.spaces.values();

            const lookForApplicationsFolder = useCallback(async () => {
                const findApplicationsFolder = Array.from(matrixSpaces).find(space => space.meta?.template === 'applications');
                if (findApplicationsFolder) {
                    console.info('found applications space');
                    return findApplicationsFolder.roomId;
                } else {
                    console.log('creating root applications folder');
                    const newApplicationsFolder = await matrix.createRoom(
                        'Applications',
                        true,
                        'This is your private applications space. You can find all your application data in here.',
                        'invite',
                        'context',
                        'applications');
                    return newApplicationsFolder;
                }
            }, [matrixSpaces, matrix]);

            const lookForServiceFolder = useCallback(async (applicationsSpaceId) => {
                const findServiceSpace = Array.from(matrix.spaces.values()).find(space => space.name === application);
                console.log(matrix.spaces);
                if (findServiceSpace) return findServiceSpace;
                else {
                    console.info('creating service space');
                    const createRoom = await matrix.createRoom(
                        application,
                        true,
                        `This is your private space for the application ${application}. You can find all your ${application} data in here.`,
                        'invite',
                        'context',
                        'application');
                    await authenticationProvider.addSpaceChild(applicationsSpaceId, createRoom);
                    console.log(matrix);
                    setTimeout(() => console.log(matrix), 50);
                    return matrix.spaces.get(createRoom);
                }
            });

            useEffect(() => {
                (async () => {
                    if (!matrix.initialSyncDone) return;

                    console.log(matrix.spaces);
                    console.log(authenticationProvider);

                    const applicationsSpaceId = await lookForApplicationsFolder();

                    console.log(matrix.spaces);

                    debugger;

                    // const applicationsSpaceId = await lookForApplicationsFolder();
                })();
                // let canceled;
                // setIsLooking(true);
                // const startLookingForFolders = async () => {
                //     if (matrix.initialSyncDone) {
                //         try {
                //             const applicationsSpaceId = await lookForApplicationsFolder();
                //             const space = await lookForServiceFolder(applicationsSpaceId);
                //             console.log(space);
                //             canceled || setServiceSpace(space);
                //         } catch (err) {
                //             canceled || setError(err);
                //         } finally {
                //             canceled || setIsLooking(false);
                //         }
                //     } else {
                //         setTimeout(() => {
                //             startLookingForFolders();
                //         }, 300);
                //     }
                // };
                // startLookingForFolders();
                // return () => { canceled = true; };
            // eslint-disable-next-line react-hooks/exhaustive-deps
            });

            return {
                space: serviceSpace,
            };
        };
    })(authenticationProvider));
};

const ServicesContext = createContext(undefined);

function useServices(applicationName, authenticationProvider, matrixData) {
    return useContext(ServicesContext)[authenticationProvider.configuration.type](applicationName, matrixData);
}

/**
 * {
 *   matrix: {
 *     write: {},
 *     stream: {},
 *     sketch: {},
 *     ...
 *   },
 *   matrixContentStorage: {},
 *   ...
 * }
 */

export {
    ServicesContext,
    useServicesProvider,
    useServices,
};

