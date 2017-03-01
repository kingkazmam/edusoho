<?php

namespace Topxia\Service\Course\Dao\Impl;

use Topxia\Service\Common\BaseDao;
use Topxia\Service\Course\Dao\CourseDao;
use Topxia\Service\Course\Dao\FavoriteDao;

class FavoriteDaoImpl extends BaseDao implements FavoriteDao
{
    protected $table = 'course_favorite';

    public function getFavorite($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ? LIMIT 1";
        return $this->getConnection()->fetchAssoc($sql, array($id)) ?: null;
    }

    public function getFavoriteByUserIdAndCourseId($userId, $courseId, $type = 'course')
    {
        $self = $this;
        return $this->fetchCached("userId:{$userId}:courseId:{$courseId}:type:{$type}", $userId, $courseId, $type, function ($userId, $courseId, $type) use ($self) {
            $sql = "SELECT * FROM {$self->getTable()} WHERE userId = ? AND courseId = ? AND type = ? LIMIT 1";
            return $self->getConnection()->fetchAssoc($sql, array($userId, $courseId, $type)) ?: null;
        });
    }

    public function findCourseFavoritesByUserId($userId, $start, $limit)
    {
        $this->filterStartLimit($start, $limit);
        $sql = "SELECT * FROM {$this->table} WHERE userId = ? AND type = 'course' ORDER BY createdTime DESC LIMIT {$start}, {$limit}";
        return $this->getConnection()->fetchAll($sql, array($userId)) ?: array();
    }

    public function findCourseFavoritesNotInClassroomByUserId($userId, $start, $limit)
    {
        $this->filterStartLimit($start, $limit);
        $sql = "SELECT f.* FROM {$this->table} f ";
        $sql .= ' JOIN  '.CourseDao::TABLENAME.' AS c ON f.userId = ?';
        $sql .= "AND f.courseId = c.id AND c.parentId = 0 AND f.type = 'course'";
        $sql .= " ORDER BY createdTime DESC LIMIT {$start}, {$limit}";

        return $this->getConnection()->fetchAll($sql, array($userId));
    }

    public function findUserFavoriteCoursesNotInClassroomWithCourseType($userId, $courseType, $start, $limit)
    {
        $this->filterStartLimit($start, $limit);
        $sql = "SELECT f.* FROM {$this->table} f ";
        $sql .= ' JOIN  '.CourseDao::TABLENAME.' AS c ON f.userId = ? AND c.type = ?';
        $sql .= "AND f.courseId = c.id AND c.parentId = 0 AND f.type = 'course'";
        $sql .= " ORDER BY createdTime DESC LIMIT {$start}, {$limit}";

        return $this->getConnection()->fetchAll($sql, array($userId, $courseType));
    }

    public function getFavoriteCourseCountByUserId($userId)
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE  userId = ? AND type = 'course'";
        return $this->getConnection()->fetchColumn($sql, array($userId));
    }

    public function addFavorite($favorite)
    {
        $affected = $this->getConnection()->insert($this->table, $favorite);
        if ($affected <= 0) {
            throw $this->createDaoException('Insert course favorite error.');
        }
        $this->clearCached();
        return $this->getFavorite($this->getConnection()->lastInsertId());
    }

    public function deleteFavorite($id)
    {
        $result = $this->getConnection()->delete($this->table, array('id' => $id));
        $this->clearCached();
        return $result;
    }

    public function searchCourseFavoriteCount($conditions)
    {
        $builder = $this->_createSearchQueryBuilder($conditions)
            ->select('COUNT(id)');
        return $builder->execute()->fetchColumn(0);
    }

    public function searchCourseFavorites($conditions, $orderBy, $start, $limit)
    {
        $this->filterStartLimit($start, $limit);
        $orderBy = $this->checkOrderBy($orderBy, array('createdTime'));
        $builder = $this->_createSearchQueryBuilder($conditions)
            ->select('*')
            ->setFirstResult($start)
            ->setMaxResults($limit);

        for ($i = 0; $i < count($orderBy); $i = $i + 2) {
            $builder->addOrderBy($orderBy[$i], $orderBy[$i + 1]);
        };
        return $builder->execute()->fetchAll() ?: array();
    }

    protected function _createSearchQueryBuilder($conditions)
    {
        $builder = $this->createDynamicQueryBuilder($conditions)
            ->from($this->table, 'course_favorite')
            ->andWhere('courseId = :courseId')
            ->andWhere('userId = :userId')
            ->andWhere('type = :type')
            ->andWhere('createdTime >= :createdTime_GE')
            ->andWhere('courseId NOT IN ( :excludeCourseIds )');
        return $builder;
    }
}
