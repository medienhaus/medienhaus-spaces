import DefaultLayout from '@/components/layouts/default';

export default function UdkTmp() {
    return (
        <DefaultLayout.LameColumn>
            <main className="[&>section+section]:mt-6 [&>section>h3+*]:mt-2">
                <section>
                    <p>
                        Berlin University of the Arts’ free and open-source environment for digital learning, teaching, and collaboration
                        will be launching soon.
                    </p>
                </section>
                <br />
                <hr />
                <br />
                <section>
                    <h3>
                        <a href="https://spaces.udk-berlin.de/classroom/" rel="nofollow noopener noreferrer" target="_blank">
                            /classroom
                        </a>
                    </h3>
                    <p>predecessor to udk/spaces (chat, audio/video calls, polls)</p>
                </section>
                <section>
                    <h3>
                        <a href="https://content.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /rundgang
                        </a>
                    </h3>
                    <p>content creation/management system for the rundgang website</p>
                </section>
                <section>
                    <h3>
                        <a href="https://stream.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /stream
                        </a>
                    </h3>
                    <p>video upload, video-on-demand, and live-streaming (like youtube)</p>
                </section>
                <br />
                <hr />
                <br />
                <section>
                    <h3>
                        <a href="https://statistics.medienhaus.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /statistics
                        </a>
                    </h3>
                    <p>anymous statistics from anonymous webserver access log files</p>
                </section>
                <section>
                    <h3>
                        <a href="https://status.medienhaus.udk-berlin.de/status/udk-berlin" rel="nofollow noopener noreferrer" target="_blank">
                            /status
                        </a>
                    </h3>
                    <p>check availability and online status for internal and public services</p>
                </section>
            </main>
        </DefaultLayout.LameColumn>
    );
}
