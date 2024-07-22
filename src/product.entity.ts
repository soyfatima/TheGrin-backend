import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'products' })
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    remise: string;

    @Column()
    price: string;

    @Column()
    category: string;

    @Column()
    uploadedFile: string;

    @Column()
    content: string;

    @Column("simple-array", { nullable: true })
    sizes: string[];
    
    @OneToMany(() => CartItem, cartItem => cartItem.product, { onDelete: 'CASCADE' })
    cartItems: CartItem[];
}
