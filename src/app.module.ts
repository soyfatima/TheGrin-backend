import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './folder.entity';
import { multerOptions } from './multerOptions';
import { AuthController } from './controller/auth.controller';
import { FolderController } from './controller/folder.controller';
import { JwtStrategy } from './jwtGuard/jwt.strategy';
import { FolderService } from './service/folder.service';
import { AuthService } from './service/auth.service';
import { Admin } from './admin.entity';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { Comment } from './comment.entity';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';
import { User } from './user.entity';
import { jwtConfig } from './jwtGuard/config';
import { Product } from './product.entity';
import { ProductService } from './service/product.service';
import { ProductController } from './controller/product.controller';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Order } from './order.entity';
import { OrderController } from './controller/order.controller';
import { CartController } from './controller/cart.controller';
import { OrderService } from './service/order.service';
import { CartService } from './service/cart.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'; // Import HandlebarsAdapter
import { MailerOptions, TransportType } from '@nestjs-modules/mailer/dist/interfaces/mailer-options.interface';
import { folderFileOptions } from './fileOption';
import { NotificationController } from './controller/notification.controller';
import { NotificationService } from './service/notification.service';
import { Notification } from './notif.entity';
import { adminFileOptions } from './adminFileOption';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'myforum',
      entities: [Admin, Folder, User, Comment, Product, Cart, CartItem, Order, Notification],
      synchronize: true,
    }),

    MulterModule.register(multerOptions),
    MulterModule.register(folderFileOptions),
    MulterModule.register(adminFileOptions),
    TypeOrmModule.forFeature([Admin, Folder, User, Comment, Product, Cart, CartItem, Order, Notification]),
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: '15mn' },
    }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp.example.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'your-email@example.com',
          pass: 'your-email-password',
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@example.com>',
      },

    }),
    // other modules

  ],
  controllers: [
    AppController,
    AuthController,
    FolderController,
    CommentController,
    ProductController,
    OrderController,
    CartController,
    NotificationController
  ],
  providers: [
    AppService,
    AuthService,
    JwtStrategy,
    FolderService,
    CommentService,
    ProductService,
    OrderService,
    CartService,
    NotificationService
  ],
})
export class AppModule { }
