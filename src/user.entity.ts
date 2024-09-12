// Import necessary modules from TypeORM
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  BeforeInsert,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import * as bcrypt from 'bcrypt';
import { Cart } from './cart.entity';
import { Order } from './order.entity';
import { CartItem } from './cart-item.entity';
import { Folder } from './folder.entity';
import { UserNoteReadStatus } from './noteread.entity';

@Entity({ name: 'users' }) 
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  username: string;
  
  @Column({ nullable: true })
  gender?: string;
  

  @Column()
  password: string;

  @Column({ nullable: true })
  uploadedFile: string;

  @BeforeInsert()
  async hashPassword() {
    if (!this.password.startsWith('$2b$10$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    const result = await bcrypt.compare(plainPassword, this.password);
    return result;
  }

  @Column({ nullable: true })
  resetCode: string;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpiration: Date;

  @OneToMany(() => Folder, (folder) => folder.user, { onDelete: 'CASCADE' })
  folders: Folder[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToOne(() => Cart, cart => cart.user, { cascade: true })
  cart: Cart;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => CartItem, cartItem => cartItem.user)
  cartItems: CartItem[];
  
  @OneToMany(() => UserNoteReadStatus, userNoteReadStatus => userNoteReadStatus.user)
  noteReadStatus: UserNoteReadStatus[];
  
  @Column({ type: 'boolean', default: false })
  blocked: boolean;

}