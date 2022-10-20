import Article from './Article';
import Event from './Event';
import Resource from './Resource';

export default function Activity() {
    const activity = [{
        author: 'Marcel',
        template: 'event',
        thumbnail: 'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
        title: 'Movie Sreening',
        body: 'August',
        parent: 'Movie Night',
        location: 'Hasenheide',
        published: '25.02.2022',
    },
    {
        author: 'Robert',
        template: 'resource',
        thumbnail: undefined,
        title: 'Amazing resource about things',
        body: 'here is my resource http://link.com',
        parent: 'Resources',
        location: undefined,
    },
    {
        author: 'Florian',
        template: 'article',
        title: 'Welcome to my Ted Talk',
        body: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repella',
        parent: 'Resources',
    }];

    return (
        <>
            <section>
                { activity.map(entry => {
                    if (entry.template === 'event') return <Event activity={entry} />;
                    if (entry.template === 'article') return <Article activity={entry} />;
                    if (entry.template === 'resource') return <Resource activity={entry} />;
                }) }
            </section>
        </>
    );
}

