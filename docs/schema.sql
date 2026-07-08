Table users {
  id integer [primary key]
  username varchar
  full_name varchar
  role varchar
  created_at timestamp
}

Table products {
  id integer [primary key]
  name varchar
  unit varchar
  net_content integer
  price double
  stock integer
  created_at timestamp
}

Table clients {
  id integer [primary key]
  name varchar
  rfc varchar
  address varchar
  phone integer
  mail varchar
  created_at timestamp
}

Table sales {
  id integer [primary key]
  date datetime
  total double
  invoice bool
  id_user integer
  id_client integer
}

Table sales_detail {
  price double
  amount integer
  id_sale integer
  id_product integer
}

Ref client_sales: sales.id_client > clients.id
Ref user_sales: sales.id_user > users.id
Ref product_sales: products.id < sales_detail.id_product
Ref sales_details: sales.id < sales_detail.id_sale