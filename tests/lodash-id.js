const
  should = require('should'),
  // debug = require('debug')('telegraf:session-local:test'),
  _db = require('../lib/lodash-id.js')

describe('lodash + lodash-id', () => {
  let db
  const _ = require('lodash')

  beforeEach(() => {
    _.mixin(_db)
    db = {
      posts: [
        { id: 1, body: 'one', published: true },
        { id: 2, body: 'two', published: false },
        { id: 3, body: 'three', published: false }
      ],
      comments: [
        { id: 1, body: 'foo', postId: 1 },
        { id: 2, body: 'bar', postId: 2 }
      ],
      authors: [
        { id: '1', name: 'foo' },
        { id: '2', name: 'bar' }
      ],
      tags: [
        { id: 1, text: '#reddit' },
        { id: '1337', text: '#9gag' },
        { text: '#medium' }
      ]
    }
  })

  describe('id', () => {
    beforeEach(() => { _.id = 'body' })
    afterEach(() => { delete _.id })

    it('is the property used by get to find document', () => {
      const expect = db.posts[0]
      const doc = _.getById(db.posts, 'one')

      should.deepEqual(doc, expect)
    })
  })

  describe('createId', () => {
    it('returns an id', () => {
      should(_.createId())
    })
  })

  describe('getById', () => {
    it('returns doc by id', () => {
      const expect = db.posts[0]
      const doc = _.getById(db.posts, 1)

      should.deepEqual(doc, expect)
    })

    it('returns doc by id with string param', () => {
      const expect = db.posts[0]
      const doc = _.getById(db.posts, '1')

      should.deepEqual(doc, expect)
    })

    it('returns doc by id with string id', () => {
      const expect = db.authors[0]
      const doc = _.getById(db.authors, 1)

      should.deepEqual(doc, expect)
    })

    it('returns undefined if doc is not found', () => {
      const doc = _.getById(db.posts, 9999)

      should.equal(doc, undefined)
    })

    it('returns undefined if doc is not found and some docs in collection without id', () => {
      const doc = _.getById(db.tags, 9999)

      should.equal(doc, undefined)
    })
  })

  describe('insert', () => {
    describe('and id is set', () => {
      it('inserts and returns inserted doc', () => {
        const doc = _.insert(db.posts, { id: 'foo', body: 'one' })

        should.equal(db.posts.length, 4)
        should.deepEqual(doc, { id: 'foo', body: 'one' })
        should.deepEqual(_.getById(db.posts, doc.id), { id: 'foo', body: 'one' })
      })

      it('does not replace in place and throws an error', () => {
        const length = db.posts.length

        should.throws(() => {
          _.insert(db.posts, { id: 2, title: 'one' })
        }, /duplicate/)
        should.equal(db.posts.length, length)
        should.deepEqual(_.getById(db.posts, 2), { id: 2, body: 'two', published: false })
        should.deepEqual(_.map(db.posts, 'id'), [1, 2, 3])
      })
    })

    describe('and id is not set', () => {
      it('inserts, sets an id and returns inserted doc', () => {
        const doc = _.insert(db.posts, { body: 'one' })

        should.equal(db.posts.length, 4)
        should(doc.id)
        should.equal(doc.body, 'one')
      })
    })
  })

  describe('upsert', () => {
    describe('and id is set', () => {
      it('inserts and returns inserted doc', () => {
        const doc = _.upsert(db.posts, { id: 'foo', body: 'one' })

        should.equal(db.posts.length, 4)
        should.deepEqual(doc, { id: 'foo', body: 'one' })
        should.deepEqual(_.getById(db.posts, doc.id), { id: 'foo', body: 'one' })
      })

      it('replaces in place and returns inserted doc', () => {
        const length = db.posts.length
        const doc = _.upsert(db.posts, { id: 2, title: 'one' })

        should.equal(db.posts.length, length)
        should.deepEqual(doc, { id: 2, title: 'one' })
        should.deepEqual(_.getById(db.posts, doc.id), { id: 2, title: 'one' })
        should.deepEqual(_.map(db.posts, 'id'), [1, 2, 3])
      })
    })

    describe('and id is not set', () => {
      it('inserts, sets an id and returns inserted doc', () => {
        const doc = _.upsert(db.posts, { body: 'one' })

        should.equal(db.posts.length, 4)
        should(doc.id)
        should.equal(doc.body, 'one')
      })
    })
  })

  describe('updateById', () => {
    it('updates doc and returns updated doc', () => {
      const doc = _.updateById(db.posts, 1, { published: false })

      should(!db.posts[0].published)
      should(!doc.published)
    })

    it('keeps initial id type', () => {
      const doc = _.updateById(db.posts, '1', { published: false })

      should.strictEqual(doc.id, 1)
    })

    it('returns undefined if doc is not found', () => {
      const doc = _.updateById(db.posts, 9999, { published: false })

      should.equal(doc, undefined)
    })
  })

  describe('updateWhere', () => {
    it('updates docs and returns updated docs', () => {
      const docs = _.updateWhere(db.posts, { published: false }, { published: true })

      should.equal(docs.length, 2)
      should(db.posts[1].published)
      should(db.posts[2].published)
    })

    it('returns an empty array if no docs match', () => {
      const docs = _.updateWhere(db.posts, { published: 'draft' }, { published: true })

      should.equal(docs.length, 0)
    })
  })

  describe('__update', () => {
    it('copies properties from an object to another', () => {
      const src = {
        1: 'one',
        test: true,
        hello: 'world',
        leet: 1337
      }
      const dst = {}
      _.__update(dst, src)

      dst.should.containDeep(src)
    })
  })

  describe('replaceById', () => {
    it('replaces doc and returns it', () => {
      const doc = _.replaceById(db.posts, 1, { foo: 'bar' })

      should.deepEqual(doc, db.posts[0])
      should.deepEqual(db.posts[0], { id: 1, foo: 'bar' })
    })

    it('keeps initial id type', () => {
      const doc = _.replaceById(db.posts, '1', { published: false })

      should.strictEqual(doc.id, 1)
    })

    it('returns undefined if doc is not found', () => {
      const doc = _.replaceById(db.posts, 9999, {})

      should.equal(doc, undefined)
    })
  })

  describe('removeById', () => {
    it('removes and returns doc ', () => {
      const expected = db.posts[0]
      const doc = _.removeById(db.posts, 1)

      should.equal(db.posts.length, 2)
      should.deepEqual(doc, expected)
    })

    it('returns undefined if doc is not found', () => {
      const doc = _.removeById(db.posts, 9999)

      should.equal(doc, undefined)
    })
  })

  describe('removeWhere', () => {
    it('removes docs', () => {
      const expected = [db.comments[0]]
      const docs = _.removeWhere(db.comments, { postId: 1 })

      should.equal(db.comments.length, 1)
      should.deepEqual(docs, expected)
    })

    it('returns an empty array if no docs match', () => {
      const docs = _.removeWhere(db.comments, { postId: 9999 })

      should.equal(docs.length, 0)
    })
  })
})
