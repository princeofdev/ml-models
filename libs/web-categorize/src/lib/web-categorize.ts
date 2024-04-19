import * as Logger from 'abstract-logging';
import {parse as tldts_parse} from 'tldts';

import {SquidCategory, WebCategory} from "libs/web-categorize/src/lib/web-category-content";
import {CategoryCacheHash} from "libs/web-categorize/src/lib/category-cache";
import {UriUtils} from "libs/web-categorize/src/lib/web-category-utils";
import {CategoryFileReader} from "libs/web-categorize/src/lib/web-category-reader";
import shorthash from 'short-hash';

interface WebCategoryResult {
  category: WebCategory
  categoryStr: string
}

const customhash = (key: any): string => {
  return shorthash(key)
};

class HostURLCategorizer {
  hostCache = new CategoryCacheHash(customhash);
  urlCache = new CategoryCacheHash(customhash);

  squidCache = new CategoryCacheHash(customhash);

  constructor(private readonly downloadFolder: string, private readonly logger?: Logger,) {
  }

  async init(): Promise<void> {
    const reader = new CategoryFileReader(
      this.downloadFolder,
      this.hostCache, this.urlCache, this.squidCache, this.logger)

    await reader.download()
    await reader.process()
  }

  getCategory(uri: string): WebCategoryResult[] {
    const {publicSuffix, hostname} = tldts_parse(uri)
    const [, , , parsedUrl] = UriUtils.parseURL(uri)

    //check url
    let categories = this.urlCache.get(parsedUrl)
    if (categories && categories.length > 0) {
      return this.categoriesToList(categories)
    }

    //check hostname (www and root)
    const categoriesHost = this.hostCache.get(hostname)
    const categoriesWithoutWWW = this.hostCache.get(hostname.replace("www.", ""))
    categories = [...categoriesHost, ...categoriesWithoutWWW]
    if (categories && categories.length > 0) {
      return this.categoriesToList(categories)
    }

    //check squid TLD's
    if (publicSuffix) {
      const res = this.squidCache.get(publicSuffix)
      if (res) {
        if (res.includes(SquidCategory.ALLOWED_TLDS)) {
          const cat = WebCategory.UNKNOWN_BUT_CLEAN;
          return [{category: cat, categoryStr: WebCategory[cat]}]
        }
        if (res.includes(SquidCategory.BLOCK_TLDS)) {
          const cat = WebCategory.UNKNOWN_DANGEROUS;
          return [{category: cat, categoryStr: WebCategory[cat]}]
        }
      }
    }

    //check squid domain's
    const hostNameResult = this.squidCache.get(hostname)
    if (hostNameResult) {
      if (hostNameResult.includes(SquidCategory.BLOCK_URL)) {
        const cat = WebCategory.UNKNOWN_DANGEROUS;
        return [{category: cat, categoryStr: WebCategory[cat]}]
      }
      if (hostNameResult.includes(SquidCategory.ALLOWED_URL) || hostNameResult.includes(SquidCategory.ALLOWED_DOMAINS)) {
        const cat = WebCategory.UNKNOWN_BUT_CLEAN;
        return [{category: cat, categoryStr: WebCategory[cat]}]
      }
      const cat = WebCategory.UNKNOWN_DANGEROUS;
      return [{category: cat, categoryStr: WebCategory[cat]}]
    }

    return null;
  }

  categoriesToList(_categories: Array<number>): WebCategoryResult[] {
    const categories = [...new Set<number>(_categories)]
    const res = new Set<WebCategoryResult>()
    if (!categories) {
      return Array.from(res);
    }
    categories.map(v => {
      res.add({category: v, categoryStr: WebCategory[v]})
    })

    return Array.from(res)
  }
}

export {HostURLCategorizer, WebCategoryResult}
