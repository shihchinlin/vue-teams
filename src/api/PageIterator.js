class PageIterator {
  constructor(client, pageCollection, callback) {
    this.client = client;
    this.collection = pageCollection.value;
    this.nextLink = pageCollection["@odata.nextLink"];
    this.deltaLink = pageCollection["@odata.deltaLink"];
    this.callback = callback;
    this.complete = false;
  }

  iterationHelper() {
    if (this.collection === undefined) {
      return false;
    }
    let advance = true;
    while (advance && this.collection.length !== 0) {
      const item = this.collection.shift();
      advance = this.callback(item);
    }
    return advance;
  }

  async fetchAndUpdateNextPageData() {
    try {
      const response = await this.client.api(this.nextLink).get();
      this.collection = response.value;
      this.nextLink = response["@odata.nextLink"];
      this.deltaLink = response["@odata.deltaLink"];
    } catch (error) {
      throw error;
    }
  }

  getDeltaLink() {
    return this.deltaLink;
  }

  async iterate() {
    try {
      let advance = this.iterationHelper();
      while (advance) {
        if (this.nextLink !== undefined) {
          await this.fetchAndUpdateNextPageData();
          advance = this.iterationHelper();
        } else {
          advance = false;
        }
      }
      if (this.nextLink === undefined && this.collection.length === 0) {
        this.complete = true;
      }
    } catch (error) {
      throw error;
    }
  }

  async resume() {
    try {
      return this.iterate();
    } catch (error) {
      throw error;
    }
  }

  isComplete() {
    return this.complete;
  }
}

export default PageIterator;
