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
                {/*
                <section>
                    <h3>
                        <a href="https://poll.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /poll
                        </a>
                    </h3>
                    <p>find appointments and schedule meetings (like doodle)</p>
                </section>
                */}
                <section>
                    <h3>
                        <a href="https://spaces.udk-berlin.de/rundgang" rel="nofollow noopener noreferrer" target="_blank">
                            /rundgang
                        </a>
                    </h3>
                    <p>content creation/management system for the rundgang website</p>
                </section>
                {/*
                <section>
                    <h3>
                        <a href="https://sketch.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /sketch
                        </a>
                    </h3>
                    <p>collaborative whiteboard for layouting and sketching (like miro)</p>
                </section>
                */}
                <section>
                    <h3>
                        <a href="https://stream.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /stream
                        </a>
                    </h3>
                    <p>video upload, video-on-demand, and live-streaming (like youtube)</p>
                </section>
                {/*
                <section>
                    <h3>
                        <a href="https://survey.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /survey
                        </a>
                    </h3>
                    <p>create surveys and questionnaires for others to fill out (like forms)</p>
                </section>
                */}
                {/*
                <section>
                    <h3>
                        <a href="https://write.udk-berlin.de/" rel="nofollow noopener noreferrer" target="_blank">
                            /write
                        </a>
                    </h3>
                    <p>collaborative writing, note-taking, and commenting (i.e. etherpad)</p>
                </section>
                */}
                <br />
                <hr />
                <br />
                <section>
                    <h3>
                        <a href="https://goaccess.monitor.medienhaus.dev/" rel="nofollow noopener noreferrer" target="_blank">
                            /statistics
                        </a>
                    </h3>
                    <p>anymous statistics from anonymous webserver access log files</p>
                </section>
                <section>
                    <h3>
                        <a href="https://status.medienhaus.dev/status/udk-berlin" rel="nofollow noopener noreferrer" target="_blank">
                            /status
                        </a>
                    </h3>
                    <p>check availability and online status for internal and public services</p>
                </section>
            </main>
        </DefaultLayout.LameColumn>
    );
}
