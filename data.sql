create table users (
    id serial primary key,
    name varchar(255) not null,
    email varchar(255) not null unique,
    password varchar(255) not null,
    type varchar(255) not null
);

create table managers (
    id serial primary key,
    user_id int not null,
    name varchar(255) not null,
    phone varchar(255) not null,
    nif varchar(255) not null,
    foreign key (user_id) references users(id)
);

create table condominiums (
    id serial primary key,
    name varchar(255) not null,
    address varchar(255) not null,
    city varchar(255) not null,
    state varchar(255) not null,
    zip varchar(255) not null,
    country varchar(255) not null,
    manager_id int not null,
    foreign key (manager_id) references managers(id)
);

create table staff (
    id serial primary key,
    user_id int not null,
    name varchar(255) not null,
    phone varchar(255) not null,
    nif varchar(255) not null,
    foreign key (user_id) references users(id)
);

create table skills (
    id serial primary key,
    name varchar(255) not null
);

create table staff_skills (
    id serial primary key,
    staff_id int not null,
    skill_id int not null,
    foreign key (staff_id) references staff(id),
    foreign key (skill_id) references skills(id),
    unique (staff_id, skill_id)
);

create table services (
    id serial primary key,
    condominium_id int not null,
    staff_id int not null,
    description varchar(255) not null,
    start_date date not null,
    end_date date not null,
    status varchar(255) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    price decimal(10, 2) not null,
    foreign key (condominium_id) references condominiums(id),
    foreign key (staff_id) references staff(id)
);

create table photo_services (
    id serial primary key,
    service_id int not null,
    photo_url varchar(255) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    foreign key (service_id) references services(id)
);

create table check_lists (
    id serial primary key,
    service_id int not null,
    description varchar(255) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    foreign key (service_id) references services(id)
);

create table check_list_items (
    id serial primary key,
    check_list_id int not null,
    description varchar(255) not null,
    completed boolean not null,
    foreign key (check_list_id) references check_lists(id)
);
