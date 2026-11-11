import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('channels', (table) => {
      table.increments('id')
      table.string('name', 64).notNullable().unique()
      table.enum('type', ['public', 'private']).notNullable()
      table.integer('admin_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.dateTime('last_message_at').notNullable().defaultTo(this.now()).index()
    })
    this.schema.createTable('channel_members', (table) => {
      table.integer('channel_id').unsigned().notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.boolean('invited').notNullable().defaultTo(false)
      table.boolean('invitation_read').notNullable().defaultTo(true)
      table.boolean('pinned').notNullable().defaultTo(false)
      table.primary(['channel_id', 'user_id'])
    })
    this.schema.createTable('channel_bans', (table) => {
      table.integer('channel_id').unsigned().notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.primary(['channel_id', 'user_id'])
    })
    this.schema.createTable('channel_kick_votes', (table) => {
      table.integer('channel_id').unsigned().notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('target_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('voter_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.primary(['channel_id', 'target_id', 'voter_id'])
    })
    this.schema.createTable('messages', (table) => {
      table.increments('id')
      table.integer('channel_id').unsigned().notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('author_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.text('mentioned_users').notNullable()
      table.dateTime('created_at').notNullable().defaultTo(this.now())
      table.index(['channel_id', 'id'])
    })
  }

  async down() {
    for (const name of ['messages', 'channel_kick_votes', 'channel_bans', 'channel_members', 'channels']) {
      this.schema.dropTable(name)
    }
  }
}
