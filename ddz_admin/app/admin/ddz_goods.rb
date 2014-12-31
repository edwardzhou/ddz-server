ActiveAdmin.register DdzGoods do

  permit_params do
    permitted = []
    permitted << :goodsId
    permitted << :goodsName
    permitted << :goodsDesc
    permitted << :goodsType
    permitted << :goodsAction
    permitted << :goodsIcon
    permitted << :goods_props_hash
    permitted << :sortIndex
    permitted
  end

  index do
    selectable_column
    id_column
    column :goodsId
    column :goodsName
    column :goodsDesc
    column :goodsType
    column :goodsAction
    column :goodsIcon
    column :goodsProps
    column :sortIndex
    column :created_at
    column :updated_at
    actions
  end

  filter :goodsId
  filter :goodsName
  filter :goodsDesc
  filter :goodsType
  filter :goodsAction

  form do |f|
    f.inputs "DdzGoods Details" do
      f.input :goodsId
      f.input :goodsName
      f.input :goodsDesc
      f.input :goodsType
      f.input :goodsAction
      f.input :goodsIcon
      f.input :sortIndex

      f.input :goods_props_hash, as: :text
    end

    f.actions
  end

end
