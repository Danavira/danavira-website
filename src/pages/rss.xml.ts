import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, slugOf } from '../lib/content';
import { localizedPath } from '../i18n';
import { site } from '../site.config';

// English posts only. A Japanese feed can live at /ja/rss.xml once there are
// Japanese posts to put in it.
export async function GET(context: APIContext) {
  const posts = await getPublishedPosts('en');
  return rss({
    title: site.name,
    description: `Writing by ${site.name}, ${site.jobTitle}`,
    site: context.site ?? 'https://danavira.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: localizedPath('en', `writing/${slugOf(post)}`),
    })),
    customData: '<language>en</language>',
  });
}
